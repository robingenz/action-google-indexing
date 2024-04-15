import * as cache from '@actions/cache'
import * as core from '@actions/core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { getAccessToken } from './shared/auth.mjs'
import {
  convertToSiteUrl,
  getEmojiForStatus,
  getPageIndexingStatus,
  getPublishMetadata,
  requestIndexing
} from './shared/gsc.mjs'
import { getSitemapPages } from './shared/sitemap.mjs'
import { batch } from './shared/utils.mjs'

const CACHE_TIMEOUT = 1000 * 60 * 60 * 24 * 7 // 7 days

export const run = async () => {
  const siteUrlInput = core.getInput('siteUrl', { required: true })
  const gcpSaKeyInput = core.getInput('gcpServiceAccountKey', {
    required: true
  })

  const accessToken = await getAccessToken(gcpSaKeyInput)
  const siteUrl = convertToSiteUrl(siteUrlInput)
  core.info(`🔎 Processing site: ${siteUrl}`)
  const siteUrlWithoutProtocol = siteUrl
    .replace('http://', 'http_')
    .replace('https://', 'https_')
    .replace('/', '_')
  const cacheRestoreKey = `google-indexing-action-${siteUrlWithoutProtocol}`
  const cacheKey = `${cacheRestoreKey}-${Date.now()}`
  const cacheFileName = siteUrlWithoutProtocol+".json";
  const cachePath = ".cache/"+"log.json";
  const [sitemaps, pages] = await getSitemapPages(accessToken, siteUrl)

  if (sitemaps.length === 0) {
    core.setFailed(
      '❌ No sitemaps found, add them to Google Search Console and try again.'
    )
    return
  }

  core.info(`👉 Found ${pages.length} URLs in ${sitemaps.length} sitemap`)

  const cacheKeyHit = await cache.restoreCache([cachePath], cacheKey, [
    cacheRestoreKey
  ])
  if (cacheKeyHit) {
    core.info(`👍 Cache hit, using previously cached data.`)
  } else {
    core.info(`👎 Cache miss, fetching data from Google Search Console.`)
  }

  const statusPerUrl = existsSync(cachePath)
    ? JSON.parse(readFileSync(cachePath, 'utf8'))
    : {}
  const pagesPerStatus = {}

  const indexableStatuses = [
    'Discovered - currently not indexed',
    'Crawled - currently not indexed',
    'URL is unknown to Google',
    'Forbidden',
    'Error'
  ]

  const shouldRecheck = (status, lastCheckedAt) => {
    const shouldIndexIt = indexableStatuses.includes(status)
    const isOld = new Date(lastCheckedAt) < new Date(Date.now() - CACHE_TIMEOUT)
    return shouldIndexIt || isOld
  }

  await batch(
    async url => {
      let result = statusPerUrl[url]
      if (!result || shouldRecheck(result.status, result.lastCheckedAt)) {
        const status = await getPageIndexingStatus(accessToken, siteUrl, url)
        result = { status, lastCheckedAt: new Date().toISOString() }
        statusPerUrl[url] = result
      }

      pagesPerStatus[result.status] = pagesPerStatus[result.status]
        ? [...pagesPerStatus[result.status], url]
        : [url]
    },
    pages,
    50,
    (batchIndex, batchCount) => {
      core.info(`📦 Batch ${batchIndex + 1} of ${batchCount} complete`)
    }
  )

  core.info(``)
  core.info(`👍 Done, here's the status of all ${pages.length} pages:`)
  mkdirSync('.cache', { recursive: true })
  writeFileSync(cachePath, JSON.stringify(statusPerUrl, null, 2))

  for (const [status, pages] of Object.entries(pagesPerStatus)) {
    core.info(`• ${getEmojiForStatus(status)} ${status}: ${pages.length} pages`)
  }
  core.info('')

  const indexablePages = Object.entries(pagesPerStatus).flatMap(
    ([status, pages]) => (indexableStatuses.includes(status) ? pages : [])
  )

  if (indexablePages.length === 0) {
    core.info(
      `✨ There are no pages that can be indexed. Everything is already indexed!`
    )
  } else {
    core.info(`✨ Found ${indexablePages.length} pages that can be indexed.`)
    indexablePages.forEach(url => core.info(`• ${url}`))
  }
  core.info(``)

  for (const url of indexablePages) {
    core.info(`📄 Processing url: ${url}`)
    const status = await getPublishMetadata(accessToken, url)
    if (status === 404) {
      await requestIndexing(accessToken, url)
      core.info(
        '🚀 Indexing requested successfully. It may take a few days for Google to process it.'
      )
    } else if (status < 400) {
      core.info(
        `🕛 Indexing already requested previously. It may take a few days for Google to process it.`
      )
    }
    core.info(``)
  }

  await cache.saveCache([cachePath], cacheKey)
  core.info(`📦 Cache saved successfully.`)
  core.info(``)

  core.info(`👍 All done!`)
  core.info(`💖 Brought to you by https://seogets.com - SEO Analytics.`)
}
