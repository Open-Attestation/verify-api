# api.verify.gov.sg

An API endpoint for `verify.gov.sg` to perform verification of OpenAttestation documents.

## Prerequisites

NodeJS `lts/fermium (v.14.15.0)`. If you're using [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to ensure you're using the same Node version in local and in your lambda's runtime.

## Getting Started

### 1. Ensure environment variables are set

To run locally, ensure the required environment variables are set in `.env`. Refer to [.env.example](.env.example):

```text
/serverless/api-verify-gov-sg/NETWORK_NAME=mainnet
/serverless/api-verify-gov-sg/INFURA_API_KEY=somekey
/serverless/api-verify-gov-sg/WHITELISTED_ISSUERS=gov.sg,openattestation.com
```

### 2. Run a local instance

```bash
npm i
npm run dev
```

### 3. Make a POST request with curl:

```bash
curl --location --request POST 'localhost:3000/dev/verify' \
--header 'Content-Type: application/json' \
--data-binary '@./fixtures/pdt_pcr_notarized_with_nric_wrapped.json'
```

**Sample response**:

```json
{
  "isValid": true,
  "fragments": [
    {
      "type": "DOCUMENT_INTEGRITY",
      "name": "OpenAttestationHash",
      "data": true,
      "status": "VALID"
    }
    // Other fragments...
  ],
  "diagnostics": []
}
```
