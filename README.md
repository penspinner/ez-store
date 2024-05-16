# EZ Store

## Setup

- Install [Node.js 20+](https://nodejs.org/en).
- Install [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/).
- Install node packages with:

  ```sh
  yarn
  ```

## Development

Run the Vite dev server:

```sh
yarn dev
```

## Deployment

First, build your app for production:

```sh
yarn build
```

Then run the app in production mode:

```sh
yarn start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `yarn build`

- `build/server`
- `build/client`
