import { useState, useRef, useEffect, useMemo } from 'react'

const ApperFileFieldComponent = ({ config, elementId }) => {
  // State for UI-driven values
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)
  
  // Refs for tracking lifecycle and preventing memory leaks
  const mountedRef = useRef(false)
  const elementIdRef = useRef(elementId)
  const existingFilesRef = useRef([])
  
  // Update elementId ref when it changes
  useEffect(() => {
    elementIdRef.current = elementId
  }, [elementId])
  
  // Memoize existing files to prevent unnecessary re-renders
  const memoizedExistingFiles = useMemo(() => {
    const files = config.existingFiles || []
    
    // Return empty array if no files exist
    if (!Array.isArray(files) || files.length === 0) {
      return []
    }
    
    // Detect actual changes by comparing length and first file's ID
    const currentLength = existingFilesRef.current.length
    const newLength = files.length
    const currentFirstId = existingFilesRef.current[0]?.Id || existingFilesRef.current[0]?.id
    const newFirstId = files[0]?.Id || files[0]?.id
    
    // If length is the same and first file ID is the same, assume no change
    if (currentLength === newLength && currentFirstId === newFirstId) {
      return existingFilesRef.current
    }
    
    return files
  }, [config.existingFiles])
  
  // Initial Mount Effect - Initialize ApperSDK and mount component
  useEffect(() => {
    let attemptCount = 0
    const maxAttempts = 50
    const attemptInterval = 100 // 100ms
    
    const initializeSDK = async () => {
      // Check if ApperSDK is loaded
      if (!window.ApperSDK) {
        attemptCount++
        if (attemptCount < maxAttempts) {
          setTimeout(initializeSDK, attemptInterval)
          return
        } else {
          const errorMsg = 'ApperSDK not loaded. Please ensure the SDK script is included before this component.'
          setError(errorMsg)
          throw new Error(errorMsg)
        }
      }
      
      try {
        const { ApperFileUploader } = window.ApperSDK
        
        if (!ApperFileUploader) {
          throw new Error('ApperFileUploader not available in ApperSDK')
        }
        
        // Set element ID for uploader instance
        elementIdRef.current = elementId
        
        // Mount the file field with config including existing files
        await ApperFileUploader.FileField.mount(elementIdRef.current, {
          ...config,
          existingFiles: memoizedExistingFiles
        })
        
        // Update refs and state
        existingFilesRef.current = memoizedExistingFiles
        mountedRef.current = true
        setIsReady(true)
        setError(null)
        
      } catch (err) {
        setError(`Failed to mount file uploader: ${err.message}`)
        console.error('ApperFileFieldComponent mount error:', err)
      }
    }
    
    initializeSDK()
    
    // Cleanup on component destruction
    return () => {
      try {
        if (mountedRef.current && window.ApperSDK?.ApperFileUploader) {
          window.ApperSDK.ApperFileUploader.FileField.unmount(elementIdRef.current)
        }
        mountedRef.current = false
        existingFilesRef.current = []
        setIsReady(false)
      } catch (err) {
        console.error('ApperFileFieldComponent unmount error:', err)
      }
    }
  }, [elementId, config.fieldKey, config.fieldName, config.tableName])
  
  // File Update Effect - Handle existing files changes
  useEffect(() => {
    // Early returns for safety checks
    if (!isReady) return
    if (!window.ApperSDK?.ApperFileUploader) return
    if (!config.fieldKey) return
    
    const updateFiles = async () => {
      try {
        // Deep equality check between current and new files
        const currentFilesStr = JSON.stringify(existingFilesRef.current)
        const newFilesStr = JSON.stringify(memoizedExistingFiles)
        
        // If files are the same, no update needed
        if (currentFilesStr === newFilesStr) {
          return
        }
        
        const { ApperFileUploader } = window.ApperSDK
        
        // Format detection and conversion if needed
        let filesToUpdate = memoizedExistingFiles
        
        // Check if files need API to UI format conversion
        if (filesToUpdate.length > 0 && filesToUpdate[0].Id !== undefined) {
          // Files are in API format, convert to UI format
          filesToUpdate = ApperFileUploader.toUIFormat(filesToUpdate)
        }
        
        // Update files or clear field based on length
        if (filesToUpdate.length > 0) {
          await ApperFileUploader.FileField.updateFiles(config.fieldKey, filesToUpdate)
        } else {
          await ApperFileUploader.FileField.clearField(config.fieldKey)
        }
        
        // Update ref with new files
        existingFilesRef.current = memoizedExistingFiles
        
      } catch (err) {
        setError(`Failed to update files: ${err.message}`)
        console.error('ApperFileFieldComponent update error:', err)
      }
    }
    
    updateFiles()
  }, [memoizedExistingFiles, isReady, config.fieldKey])
  
  // Error UI
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 text-red-500">⚠</div>
          <p className="text-sm text-red-700 font-medium">File Upload Error</p>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="file-uploader-container">
      {/* Main container with unique ID for SDK to take over */}
      <div id={elementId} className="file-upload-area">
        {/* Loading UI when not ready */}
        {!isReady && (
          <div className="flex items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading file uploader...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApperFileFieldComponent