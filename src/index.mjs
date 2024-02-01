import * as core from '@actions/core'
import { run } from './main.mjs'

try {
  await run()
} catch (error) {
  core.setFailed(error.message)
}
