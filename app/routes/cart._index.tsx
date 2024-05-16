import { checkout, getOrCreateCart, removeProductFromCart } from '#app/db.js'
import {
  ClientActionFunctionArgs,
  ClientLoaderFunctionArgs,
  Form,
  Link,
  MetaFunction,
  redirect,
  useFetcher,
  useLoaderData,
} from '@remix-run/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { items } from '#app/items.js'
import { formatMoney } from '#app/utils.js'
import { z } from 'zod'
import { parseWithZod } from '@conform-to/zod'

export const meta: MetaFunction = () => {
  return [{ title: 'Cart' }]
}

export function loader() {
  const productsById = items.reduce<Record<string, (typeof items)[number]>>((prev, item) => {
    prev[item.id] = item
    return prev
  }, {})
  return { productsById }
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const [bareCart, serverLoaderData] = await Promise.all([
    getOrCreateCart(),
    serverLoader<typeof loader>(),
  ])
  const cart = bareCart.map((item) => ({
    ...item,
    total: item.quantity * serverLoaderData.productsById[item.id].price,
    product: serverLoaderData.productsById[item.id],
  }))
  return {
    ...serverLoaderData,
    cart,
    orderTotal: cart.reduce((prev, item) => prev + item.total, 0),
  }
}

clientLoader.hydrate = true

export function HydrateFallback() {
  return <CartIndexLayout>Loading...</CartIndexLayout>
}

function CartIndexLayout({ children }: React.PropsWithChildren) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        {children}
      </div>
    </div>
  )
}

const cartActionSchema = z.discriminatedUnion('intent', [
  z.object({
    intent: z.literal('checkout'),
  }),
  z.object({
    intent: z.literal('remove-from-cart'),
    productId: z.string(),
  }),
])

export async function clientAction({ request }: ClientActionFunctionArgs) {
  const parsed = parseWithZod(await request.formData(), { schema: cartActionSchema })

  if (parsed.status !== 'success') {
    return { lastResult: parsed.reply() }
  }

  switch (parsed.value.intent) {
    case 'checkout': {
      const order = await checkout()
      return redirect(`/orders/${order.id}`)
    }
    case 'remove-from-cart': {
      await removeProductFromCart(parsed.value.productId)
      return null
    }
    default: {
      return null
    }
  }
}

export default function CartIndexPage() {
  const { cart, orderTotal } = useLoaderData<typeof clientLoader>()
  // TODO: on error, display error messages.
  return (
    <CartIndexLayout>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
      {cart.length > 0 ? (
        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {cart.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">{formatMoney(orderTotal)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">{formatMoney(orderTotal)}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <Form method="POST">
                <button
                  type="submit"
                  name="intent"
                  value="checkout"
                  className="w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50"
                >
                  Checkout
                </button>
              </Form>
            </div>
          </section>
        </div>
      ) : (
        <p className="mt-12 border-t border-gray-200 py-12 text-xl">
          You have no items in your shopping cart.
        </p>
      )}
    </CartIndexLayout>
  )
}

function CartItem({
  item,
}: {
  item: { id: string; quantity: number; total: number; product: (typeof items)[number] }
}) {
  const fetcher = useFetcher<typeof clientAction>()
  return (
    <li className="flex py-6 sm:py-10">
      <div className="flex-shrink-0">
        <img
          src={item.product.imageUrl}
          alt={item.product.description}
          className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
        />
      </div>

      <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
        <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
          <div>
            <div className="flex justify-between">
              <h3 className="text-sm">
                <Link
                  to={`/products/${item.product.id}`}
                  className="font-medium text-gray-700 hover:text-gray-800"
                >
                  {item.product.name}
                </Link>
              </h3>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Price: <span className="text-gray-600">{formatMoney(item.product.price)}</span>
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Quantity: <span className="text-gray-600">{item.quantity}</span>
            </p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              Total: <span className="text-gray-600">{formatMoney(item.total)}</span>
            </p>
          </div>

          <div className="mt-4 sm:mt-0 sm:pr-9">
            <div className="absolute right-0 top-0">
              <fetcher.Form method="POST">
                <input type="hidden" name="productId" value={item.product.id} />
                <button
                  type="submit"
                  name="intent"
                  value="remove-from-cart"
                  className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Remove</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </fetcher.Form>
            </div>
          </div>
        </div>
      </div>
    </li>
  )
}

export function ErrorBoundary() {
  return <CartIndexLayout>An error occurred while loading the page.</CartIndexLayout>
}
