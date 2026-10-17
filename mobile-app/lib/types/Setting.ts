import type Color from './Color'

type Setting = {
  color: Color
  theme: 'light' | 'dark' | 'auto'
  apiUrl: string // e.g. https://<id>.execute-api.<region>.amazonaws.com/prod
  apiKey: string
  userId: string
  businessIds: string[]
  carIds: string[]
  houseIds: string[]
  hasTps: boolean
  hasTvq: boolean
}

export default Setting
