import { getApperClient } from '@/services/apperClient'
import { toast } from 'react-toastify'

const TABLE_NAME = 'files_c'

export const fileService = {
  async getAll() {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_size_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_c"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)

      if (!response?.data?.length) {
        return []
      }

      return response.data
    } catch (error) {
      console.error("Error fetching files:", error?.response?.data?.message || error)
      return []
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_size_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_c"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "CreatedOn"}}
        ]
      }

      const response = await apperClient.getRecordById(TABLE_NAME, id, params)

      if (!response?.data) {
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching file ${id}:`, error?.response?.data?.message || error)
      return null
    }
  },

  async getByTaskId(taskId) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        fields: [
          {"field": {"Name": "Id"}},
          {"field": {"Name": "Name"}},
          {"field": {"Name": "file_name_c"}},
          {"field": {"Name": "file_size_c"}},
          {"field": {"Name": "upload_date_c"}},
          {"field": {"Name": "task_c"}},
          {"field": {"Name": "file_c"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        where: [
          {
            "FieldName": "task_c",
            "Operator": "EqualTo",
            "Values": [parseInt(taskId)],
            "Include": true
          }
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)

      if (!response?.data?.length) {
        return []
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching files for task ${taskId}:`, error?.response?.data?.message || error)
      return []
    }
  },

  async create(fileData) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Convert file to proper database format
      const { ApperFileUploader } = window.ApperSDK
      let fileField = null

      if (fileData.file_c) {
        fileField = Array.isArray(fileData.file_c) 
          ? fileData.file_c.map(file => ApperFileUploader.toCreateFormat(file))
          : ApperFileUploader.toCreateFormat(fileData.file_c)
      }

      const params = {
        records: [{
          Name: fileData.Name || fileData.file_name_c || "",
          file_name_c: fileData.file_name_c || "",
          file_size_c: fileData.file_size_c || 0,
          upload_date_c: fileData.upload_date_c || new Date().toISOString(),
          task_c: parseInt(fileData.task_c),
          file_c: fileField,
          Tags: fileData.Tags || ""
        }]
      }

      const response = await apperClient.createRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} file records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0 ? successful[0].data : null
      }

      return null
    } catch (error) {
      console.error("Error creating file:", error?.response?.data?.message || error)
      return null
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      const params = {
        RecordIds: [parseInt(id)]
      }

      const response = await apperClient.deleteRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return false
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)

        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} file records:`, failed)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }

        return successful.length > 0
      }

      return false
    } catch (error) {
      console.error("Error deleting file:", error?.response?.data?.message || error)
      return false
    }
  }
}

export default fileService