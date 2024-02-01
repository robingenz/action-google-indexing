import * as core from '@actions/core'
import { run } from './main.mjs'

try {
  run()
} catch (error) {
  core.setFailed(error.message)
}
