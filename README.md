# google-indexing-action

GitHub Action to get your site indexed on Google in less than 48 hours based on [goenning/google-indexing-script](https://github.com/goenning/google-indexing-script) by [@goenning](https://twitter.com/goenning).[^1]

You can read more about the motivation behind it and how it works in [this blog post](https://seogets.com/blog/google-indexing-script).

## Preparation

1. Follow [this guide](https://developers.google.com/search/apis/indexing-api/v3/prereqs) from Google. By the end of it, you should have a project on Google Cloud with the Indexing API enabled and a service account with the `Owner` permission for your sites.
2. Make sure to enable both the `Google Search Console API` and the `Web Search Indexing API` via [Google Project > API Services > Enabled API & Services](https://console.cloud.google.com/apis/dashboard).
3. [Download the JSON](https://github.com/goenning/google-indexing-script/issues/2) file containing the credentials for your service account. Create a secret in your GitHub repository with the content of this file (see [Creating secrets for a repository](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository)).

## Usage

```yaml
- uses: robingenz/google-indexing-action@main
  with:
    # The domain or site URL of the site to be indexed.
    # Required.
    siteUrl: ''
    # The GCP service account key in JSON format.
    # Required.
    gcpServiceAccountKey: ''
```

## Example

```yaml
name: Google Indexing
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  google-indexing:
    runs-on: ubuntu-latest
    steps:
      - uses: robingenz/google-indexing-action@main
        with:
          siteUrl: 'example.tld'
          gcpServiceAccountKey: ${{ secrets.GCP_SA_KEY }}
```

## License

See [LICENSE](./LICENSE).

[^1]: This project is not affiliated with, endorsed by, sponsored by, or approved by Google LLC or any of their affiliates or subsidiaries. 
