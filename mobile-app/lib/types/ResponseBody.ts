type ResponseBody<T> = {
  statusCode: number
  message: string
  data: T
}

export default ResponseBody
