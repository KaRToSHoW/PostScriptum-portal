import { subscriptionsApi } from './subscriptions'

/*
  ЗАГЛУШКА ОПЛАТЫ.
  Платёжный шлюз (ЮKassa) ещё не подключён. Интерфейс уже работает так, как будет с онлайн-оплатой:
  checkout() принимает тариф, ученика и способ оплаты и возвращает результат.
  Сейчас вместо списания денег отправляется заявка администратору (POST /api/subscriptions/purchase-request),
  он связывается с покупателем и оформляет абонемент вручную.

  При подключении шлюза: бэкенд создаёт платёж и возвращает { mode: 'redirect', confirmationUrl },
  фронтенд переходит по ссылке, а абонемент создаётся по webhook об успешной оплате.
*/
export const PAYMENTS_ONLINE = false

export const paymentsApi = {
  async checkout({ planId, studentId, method }) {
    await subscriptionsApi.purchaseRequest({ planId, studentId, paymentMethod: method })
    return { mode: 'manual' }
  },
}
