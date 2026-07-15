export type AsyncDataState<T> =
  | {
      status: 'loading'
      loading: true
      data: null
      error: null
    }
  | {
      status: 'success'
      loading: false
      data: T
      error: null
    }
  | {
      status: 'error'
      loading: false
      data: null
      error: string
    }
