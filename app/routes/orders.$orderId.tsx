import { getOrder } from '#app/db.js'
import { items } from '#app/items.js'
import { formatMoney } from '#app/utils.js'
import { ClientLoaderFunctionArgs, Link, MetaFunction, useLoaderData } from '@remix-run/react'

export const meta: MetaFunction<typeof clientLoader> = ({ data }) => {
  // @ts-expect-error Types not ready yet.
  return [{ title: data ? `Order ${data.order.id}` : 'Order' }]
}

export function loader() {
  const productsById = items.reduce<Record<string, (typeof items)[number]>>((prev, item) => {
    prev[item.id] = item
    return prev
  }, {})
  return { productsById }
}

export async function clientLoader({ params, serverLoader }: ClientLoaderFunctionArgs) {
  if (!params.orderId) throw new Error('orderId is required.')
  const [order, serverLoaderData] = await Promise.all([
    getOrder(params.orderId),
    serverLoader<typeof loader>(),
  ])

  if (!order) {
    throw new Response()
  }

  const cart = order.cart.map((item) => ({
    ...item,
    total: item.quantity * serverLoaderData.productsById[item.id].price,
    product: serverLoaderData.productsById[item.id],
  }))
  return {
    order: { ...order, cart },
    orderTotal: cart.reduce((prev, item) => prev + item.product.price, 0),
  }
}

clientLoader.hydrate = true

export function HydrateFallback() {
  return <div>Loading...</div>
}

export default function OrderPage() {
  const { order, orderTotal } = useLoaderData<typeof clientLoader>()
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-base font-medium text-indigo-600">Thank you!</h1>
          <p className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            It&apos;s on the way!
          </p>
          <p className="mt-2 text-base text-gray-500">
            Your order {order.id} has shipped and will be with you soon.
          </p>
        </div>

        <div className="mt-10 border-t border-gray-200">
          <h2 className="sr-only">Your order</h2>

          <h3 className="sr-only">Items</h3>
          {order.cart.map((item) => (
            <div key={item.product.id} className="flex space-x-6 border-b border-gray-200 py-10">
              <img
                src={item.product.imageUrl}
                alt=""
                className="h-20 w-20 flex-none rounded-lg bg-gray-100 object-cover object-center sm:h-40 sm:w-40"
              />
              <div className="flex flex-auto flex-col">
                <div>
                  <h4 className="font-medium text-gray-900">
                    <Link to={`/products/${item.product.id}`}>{item.product.name}</Link>
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">{item.product.description}</p>
                </div>
                <div className="mt-6 flex flex-1 items-end">
                  <dl className="flex space-x-4 divide-x divide-gray-200 text-sm sm:space-x-6">
                    <div className="flex">
                      <dt className="font-medium text-gray-900">Quantity</dt>
                      <dd className="ml-2 text-gray-700">{item.quantity}</dd>
                    </div>
                    <div className="flex pl-4 sm:pl-6">
                      <dt className="font-medium text-gray-900">Price</dt>
                      <dd className="ml-2 text-gray-700">{item.product.price}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          ))}

          <div className="sm:ml-40 sm:pl-6">
            <h3 className="sr-only">Your information</h3>

            <h4 className="sr-only">Addresses</h4>
            <dl className="grid grid-cols-2 gap-x-6 py-10 text-sm">
              <div>
                <dt className="font-medium text-gray-900">Shipping address</dt>
                <dd className="mt-2 text-gray-700">
                  <address className="not-italic">
                    <span className="block">-</span>
                    <span className="block">-</span>
                    <span className="block">-</span>
                  </address>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Billing address</dt>
                <dd className="mt-2 text-gray-700">
                  <address className="not-italic">
                    <span className="block">-</span>
                    <span className="block">-</span>
                    <span className="block">-</span>
                  </address>
                </dd>
              </div>
            </dl>

            <h3 className="sr-only">Summary</h3>

            <dl className="space-y-6 border-t border-gray-200 pt-10 text-sm">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-900">Subtotal</dt>
                <dd className="text-gray-700">{formatMoney(orderTotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-900">Total</dt>
                <dd className="text-gray-900">{formatMoney(orderTotal)}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
