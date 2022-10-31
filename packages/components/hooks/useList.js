import { ref, reactive, watch, watchEffect, computed, nextTick, inject } from 'vue'
import { getObjectKey } from '~/utils/utils'
import { useUrlSearchParams } from '@vueuse/core'

export const listProps = {
  params: Object,
  api: Function,
  loading: {
    /* 没传，默认设置undefined */
    type: Boolean,
    default ({ city }) {
      return city
    }
  },
  isPage: {
    type: Boolean,
    default: true
  }
}

export const listEmit = ['update:loading', 'callback']

export default (props, emits) => {
  const configData = inject('projectConfigData')
  const tableConfig = computed(() => configData.value.table)
  const pageField = computed(() => tableConfig.value.pageField)
  const limitField = computed(() => tableConfig.value.limitField)
  const totalField = computed(() => tableConfig.value.totalField)
  const dataField = computed(() => tableConfig.value.dataField)
  const searchParams = useUrlSearchParams('hash')

  const tableData = ref([])
  const total = ref(0)
  const tableLoading = ref(true)
  const searchPage = computed(() => Number(searchParams.page || 1))
  const pageData = reactive({
    [tableConfig.value.pageField]: searchPage.value,
    [tableConfig.value.limitField]: 20
  })

  watchEffect(() => {
    const { loading } = props
    if (loading !== undefined) {
      tableLoading.value = loading
    } else {
      tableLoading.value = false
    }
  })

  watchEffect(() => {
    Object.assign(pageData, props.params)
  })

  /* 获取列表数据 */
  const getList = async () => {
    if (!props.api) {
      return
    }
    try {
      emits('update:loading', true)
      tableLoading.value = true
      let queryData = pageData
      if (!props.isPage) {
        queryData = props.params
      }
      const resData = await props.api(queryData)
      if (props.isPage) {
        tableData.value = getObjectKey(resData, dataField.value)
        total.value = Number(getObjectKey(resData, totalField.value))
      } else {
        tableData.value = resData.data
      }
      emits('callback', tableData.value, tableData)
    } finally {
      emits('update:loading', false)
      tableLoading.value = false
    }
  }

  /* 点击当前页 */
  const clickPage = (e) => {
    searchParams.page = e
    pageData[tableConfig.value.pageField] = e
    getList()
  }

  /* 刷新 */
  const refresh = () => {
    if (props.isPage) {
      searchParams.page = 1
      pageData[tableConfig.value.pageField] = 1
    }
    nextTick(() => {
      getList()
    })
  }

  return {
    configData,
    tableConfig,
    pageField,
    limitField,
    totalField,
    dataField,
    searchParams,
    tableData,
    total,
    tableLoading,
    searchPage,
    pageData,

    getList,
    clickPage,
    refresh

  }
}
