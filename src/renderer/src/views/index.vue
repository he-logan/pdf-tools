<template>
  <div class="views-pdf">
    <el-upload
      v-model:file-list="fileList"
      class="upload-demo"
      action="#"
      :auto-upload="false"
      multiple
      :on-remove="handleRemove"
      :on-change="handleChange"
      :limit="1"
      :on-exceed="handleExceed"
      accept=".pdf"
    >
      <el-button type="primary">选择文件</el-button>
      <!-- <template #tip>
        <div class="el-upload__tip">只能选择PDF文件</div>
      </template> -->
    </el-upload>
    <!-- <input id="pdfInput" type="file" accept=".pdf" /> -->
    <!-- <button id="splitButton" @click="handleSplit">拆分 PDF</button> -->
  </div>
</template>
<script setup lang="ts">
import '@renderer/css/pdf/index.css'
// import { PDFDocument } from 'pdf-lib'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'

const fileList = ref<UploadUserFile[]>([])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  // 文件列表移除文件时的钩子
  console.log(file, uploadFiles)
}
const handleChange: UploadProps['onChange'] = (file, uploadFiles) => {
  // 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用
  console.log(file, uploadFiles)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  console.log(files, uploadFiles)
  ElMessage.warning('目前每次只能处理一份文件')
}

// const handleSplit = async () => {
//   const pdfInput = document.getElementById('pdfInput') as HTMLInputElement
//   if (pdfInput !== null) {
//     const file = pdfInput.files ? pdfInput.files[0] : { arrayBuffer: () => '' }
//     if (!file) {
//       alert('请选择一个 PDF 文件')
//       return
//     }
//     const arrayBuffer = await file.arrayBuffer()
//     const pdfDoc = await PDFDocument.load(arrayBuffer)
//     const numPages = pdfDoc.getPageCount()
//     let currentPdf = await PDFDocument.create()
//     let currentSize = 0
//     let partIndex = 1

//     for (let i = 0; i < numPages; i++) {
//       const tempPdf = await PDFDocument.create()
//       const [copiedPage] = await tempPdf.copyPages(pdfDoc, [i])
//       tempPdf.addPage(copiedPage)
//       const tempBytes = await tempPdf.save()
//       const tempSize = tempBytes.length

//       if (currentSize + tempSize > 1024 * 1000) {
//         const pdfBytes = await currentPdf.save()
//         const blob = new Blob([pdfBytes], { type: 'application/pdf' })
//         const url = URL.createObjectURL(blob)

//         const a = document.createElement('a')
//         a.href = url
//         a.download = `part_${partIndex}.pdf`
//         a.click()

//         URL.revokeObjectURL(url)

//         currentPdf = await PDFDocument.create()
//         currentSize = 0
//         partIndex++
//       }

//       const [pageToAdd] = await currentPdf.copyPages(pdfDoc, [i])
//       currentPdf.addPage(pageToAdd)
//       currentSize += tempSize
//     }

//     if (currentPdf.getPageCount() > 0) {
//       const pdfBytes = await currentPdf.save()
//       const blob = new Blob([pdfBytes], { type: 'application/pdf' })
//       const url = URL.createObjectURL(blob)

//       const a = document.createElement('a')
//       a.href = url
//       a.download = `part_${partIndex}.pdf`
//       a.click()

//       URL.revokeObjectURL(url)
//     }
//   }
// }
</script>
