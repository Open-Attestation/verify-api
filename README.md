# api.verify.gov.sg

An API endpoint for `verify.gov.sg` to perform verification of Open Attestation documents.

## Prerequisites

NodeJS `lts/fermium (v.14.15.0)`. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

## Getting Started

To run locally:

```bash
npm i
npm run dev
```

Make a POST request with curl:

```bash
curl --location --request POST 'localhost:3000/dev/verify' \
--header 'Content-Type: application/json' \
--data-binary '@./fixtures/pdt_pcr_notarized_with_nric_wrapped.json'
```
