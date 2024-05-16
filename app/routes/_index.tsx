import type { LoaderFunctionArgs } from '@remix-run/node'

export function loader({ response }: LoaderFunctionArgs) {
  response!.status = 302
  response!.headers.set('Location', '/products')
  return null
}
