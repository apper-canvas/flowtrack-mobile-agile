import { getApperClient } from "@/services/apperClient"
import { toast } from "react-toastify"

const TABLE_NAME = "task_c"

export const taskService = {
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
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "file_attachments_c"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return []
      }

      return response.data || []
    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error)
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
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}},
          {"field": {"Name": "Tags"}},
          {"field": {"Name": "file_attachments_c"}}
        ]
      }

      const response = await apperClient.getRecordById(TABLE_NAME, parseInt(id), params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      return response.data
    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error)
      return null
    }
  },

async create(taskData) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Only include updateable fields in create payload
      const params = {
        records: [{
          Name: taskData.Name || taskData.title, // Support both field names for compatibility
          description_c: taskData.description_c || taskData.description,
          priority_c: taskData.priority_c || taskData.priority,
          status_c: taskData.status_c || taskData.status,
          completed_at_c: taskData.completed_at_c || taskData.completedAt,
          Tags: taskData.Tags || ""
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
          console.error(`Failed to create ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }
        
        const createdTask = successful.length > 0 ? successful[0].data : null
        
        // Handle file attachments if provided
        if (createdTask && taskData.files && taskData.files.length > 0) {
          const { fileService } = await import('@/services/api/fileService')
          
          for (const file of taskData.files) {
            try {
              await fileService.create({
                Name: file.name || "Uploaded File",
                file_name_c: file.name,
                file_size_c: file.size || 0,
                upload_date_c: new Date().toISOString(),
                task_c: createdTask.Id,
                file_c: file,
                Tags: ""
              })
            } catch (fileError) {
              console.error("Error creating file attachment:", fileError)
              // Don't fail task creation if file attachment fails
            }
          }
        }
        
        return createdTask
      }
      
      return null
    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error)
      return null
    }
  },

  async update(id, updates) {
    try {
      const apperClient = getApperClient()
      if (!apperClient) {
        throw new Error("ApperClient not initialized")
      }

      // Only include updateable fields in update payload
      const updateData = {
        Id: parseInt(id)
      }

      // Map both old and new field names for compatibility
      if (updates.Name !== undefined || updates.title !== undefined) {
        updateData.Name = updates.Name || updates.title
      }
      if (updates.description_c !== undefined || updates.description !== undefined) {
        updateData.description_c = updates.description_c || updates.description
      }
      if (updates.priority_c !== undefined || updates.priority !== undefined) {
        updateData.priority_c = updates.priority_c || updates.priority
      }
      if (updates.status_c !== undefined || updates.status !== undefined) {
        updateData.status_c = updates.status_c || updates.status
      }
      if (updates.completed_at_c !== undefined || updates.completedAt !== undefined) {
        updateData.completed_at_c = updates.completed_at_c || updates.completedAt
      }
      if (updates.Tags !== undefined) {
        updateData.Tags = updates.Tags
      }

      const params = {
        records: [updateData]
      }

      const response = await apperClient.updateRecord(TABLE_NAME, params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return null
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} records:`, failed)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }
        
        return successful.length > 0 ? successful[0].data : null
      }
      
      return null
    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error)
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
          console.error(`Failed to delete ${failed.length} records:`, failed)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }
        
        return successful.length > 0
      }
      
      return true
    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error)
      return false
    }
  }
}