import { getOrders } from '#app/db.js'
import { ClientLoaderFunctionArgs, Link, useLoaderData } from '@remix-run/react'
import { formatDate, formatMoney } from '#app/utils.js'
import { items } from '#app/items.js'
import { MetaFunction } from '@remix-run/node'

export const meta: MetaFunction = () => {
  return [{ title: 'Orders' }]
}

export function loader() {
  const productsById = items.reduce<Record<string, (typeof items)[number]>>((prev, item) => {
    prev[item.id] = item
    return prev
  }, {})
  return { productsById }
}

export async function clientLoader({ serverLoader }: ClientLoaderFunctionArgs) {
  const [orders, serverLoaderData] = await Promise.all([getOrders(), serverLoader<typeof loader>()])
  return {
    ...serverLoaderData,
    orders: orders.map((order) => {
      const cart = order.cart.map((item) => ({
        ...item,
        total: item.quantity * serverLoaderData.productsById[item.id].price,
        product: serverLoaderData.productsById[item.id],
      }))
      return { ...order, cart, total: cart.reduce((prev, item) => prev + item.total, 0) }
    }),
  }
}

clientLoader.hydrate = true

export function HydrateFallback() {
  return <div>Loading...</div>
}

export default function OrdersPage() {
  const { orders } = useLoaderData<typeof clientLoader>()
  return (
    <div className="bg-white">
      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
          <div className="mx-auto max-w-2xl px-4 lg:max-w-4xl lg:px-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Order history
            </h1>
            <p className="mt-2 text-sm text-gray-500">Check the status of recent orders.</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="sr-only">Recent orders</h2>
          <div className="mx-auto max-w-7xl sm:px-2 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-8 sm:px-4 lg:max-w-4xl lg:px-0">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border-b border-t border-gray-200 bg-white shadow-sm sm:rounded-lg sm:border"
                >
                  <h3 className="sr-only">
                    Order placed on{' '}
                    <time dateTime={order.dateOrdered.toLocaleString()}>
                      {formatDate(order.dateOrdered)}
                    </time>
                  </h3>

                  <div className="flex items-center border-b border-gray-200 p-4 sm:grid sm:grid-cols-4 sm:gap-x-6 sm:p-6">
                    <dl className="grid flex-1 grid-cols-2 gap-x-6 text-sm sm:col-span-3 sm:grid-cols-3 lg:col-span-2">
                      <div>
                        <dt className="font-medium text-gray-900">Order ID</dt>
                        <dd className="mt-1 text-gray-500">{order.id}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-900">Total amount</dt>
                        <dd className="mt-1 font-medium text-gray-900">
                          {formatMoney(order.total)}
                        </dd>
                      </div>
                    </dl>

                    <div className="hidden lg:col-span-2 lg:flex lg:items-center lg:justify-end lg:space-x-4">
                      <Link
                        to={`/orders/${order.id}`}
                        className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        <span>View Order</span>
                        <span className="sr-only">{order.id}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Products */}
                  <h4 className="sr-only">Items</h4>
                  <ul className="divide-y divide-gray-200">
                    {order.cart.map((item) => (
                      <li key={item.product.id} className="p-4 sm:p-6">
                        <div className="flex items-center sm:items-start">
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200 sm:h-40 sm:w-40">
                            <img
                              src={item.product.imageUrl}
                              alt=""
                              className="h-full w-full object-cover object-center"
                            />
                          </div>
                          <div className="ml-6 flex-1 text-sm">
                            <div className="font-medium text-gray-900 sm:flex sm:justify-between">
                              <h5>{item.product.name}</h5>
                              <p className="mt-2 sm:mt-0">{formatMoney(item.product.price)}</p>
                            </div>
                            <p className="hidden text-gray-500 sm:mt-2 sm:block">
                              {item.product.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center space-x-4 divide-x divide-gray-200 border-t border-gray-200 pt-4 text-sm font-medium sm:ml-4 sm:mt-0 sm:border-none">
                          <div className="flex flex-1 justify-end">
                            <Link
                              to={`/products/${item.product.id}`}
                              className="whitespace-nowrap text-indigo-600 hover:text-indigo-500"
                            >
                              View product
                            </Link>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
