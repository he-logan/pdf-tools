<template>
  <div class="views-pdf">
    <div class="sidebar">
      <el-card shadow="hover" class="config-card">
        <div class="config-title">拆分配置</div>
        <el-radio-group v-model="splitMode">
          <el-radio label="page">按页拆分</el-radio>
          <el-radio label="size">按大小拆分</el-radio>
        </el-radio-group>

        <div v-if="splitMode === 'page'" class="control-block">
          <div class="control-label">输入拆分页码</div>
          <el-input v-model="pageRanges" placeholder="示例：1-2,3,4-6" />
          <div class="help-text">不输入则每页单独拆分成一个 PDF。</div>
        </div>

        <div v-if="splitMode === 'size'" class="control-block">
          <div class="control-label">每个 PDF 最大 KB</div>
          <el-input-number v-model="maxSizeKb" :min="1" :controls-position="'right'" />
          <div class="help-text">输出的每个 PDF 尽可能不超过此大小。</div>
        </div>

        <el-button type="primary" class="action-btn" @click="handleSplit" :loading="working">开始拆分</el-button>
      </el-card>
    </div>

    <div class="main-panel">
      <el-card shadow="hover" class="upload-card">
        <div class="config-title">输入 PDF 文件</div>
        <el-upload
          v-model:file-list="fileList"
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-remove="handleRemove"
          :on-change="handleChange"
          :limit="1"
          :on-exceed="handleExceed"
          accept=".pdf"
          multiple
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件或点击上传</div>
          <template #tip>
            <div class="el-upload__tip">仅支持 PDF 文件，每次处理一个文件。</div>
          </template>
        </el-upload>
        <div class="file-info" v-if="selectedFileName">已选择：{{ selectedFileName }}</div>
      </el-card>

      <el-card v-if="results.length > 0" shadow="hover" class="result-card">
        <div class="config-title">拆分结果</div>
        <div class="result-text">共生成 {{ results.length }} 个 PDF 文件。</div>
        <el-list>
          <el-list-item v-for="item in results" :key="item.name">
            <span>{{ item.name }}</span>
          </el-list-item>
        </el-list>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@renderer/css/pdf/index.css'
import { PDFDocument } from 'pdf-lib'
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

import type { UploadProps, UploadUserFile } from 'element-plus'

type SplitMode = 'page' | 'size'

const splitMode = ref<SplitMode>('page')
const pageRanges = ref('')
const maxSizeKb = ref(1000)
const fileList = ref<UploadUserFile[]>([])
const selectedFile = ref<File | null>(null)
const working = ref(false)
const results = ref<{ name: string }[]>([])

const selectedFileName = computed(() => selectedFile.value?.name ?? '')

const cleanupResults = () => {
  results.value = []
}

onBeforeUnmount(() => {
  cleanupResults()
})

const handleRemove: UploadProps['onRemove'] = () => {
  selectedFile.value = null
  cleanupResults()
}

const handleChange: UploadProps['onChange'] = (_file, uploadFiles) => {
  if (uploadFiles.length > 0) {
    const lastFile = uploadFiles[uploadFiles.length - 1]
    selectedFile.value = lastFile.raw as File
  } else {
    selectedFile.value = null
  }
  fileList.value = uploadFiles.slice(-1)
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('目前每次只能处理一份文件')
}

const parseRanges = (rangeText: string, pageCount: number) => {
  if (!rangeText.trim()) {
    return Array.from({ length: pageCount }, (_, index) => ({ start: index + 1, end: index + 1 }))
  }

  const rangeParts = rangeText
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const ranges: { start: number; end: number }[] = []

  for (const part of rangeParts) {
    if (/^\d+-\d+$/.test(part)) {
      const [startRaw, endRaw] = part.split('-')
      const start = Number(startRaw)
      const end = Number(endRaw)
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > pageCount) {
        throw new Error('页码范围格式不正确：' + part)
      }
      ranges.push({ start, end })
    } else if (/^\d+$/.test(part)) {
      const page = Number(part)
      if (page < 1 || page > pageCount) {
        throw new Error('页码超出范围：' + page)
      }
      ranges.push({ start: page, end: page })
    } else {
      throw new Error('页码格式错误：' + part)
    }
  }

  return ranges
}

const buildPdfFile = async (bytes: Uint8Array, index: number, baseName: string) => {
  const fileName = `${baseName}_part_${index}.pdf`
  return { name: fileName, bytes }
}

const saveSplitFiles = async (files: Array<{ name: string; bytes: Uint8Array }>) => {
  const api = window.api as {
    saveSplitFiles: (files: Array<{ name: string; bytes: Uint8Array }>) => Promise<{ canceled: boolean; directory?: string }>
  }
  const result = await api.saveSplitFiles(files)
  if (result.canceled) {
    throw new Error('已取消保存。')
  }
  results.value = files.map((file) => ({ name: file.name, url: '' }))
}

const splitByRanges = async (pdfBytes: Uint8Array, ranges: { start: number; end: number }[]) => {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  let index = 1
  const baseName = selectedFile.value?.name.replace(/\.pdf$/i, '') ?? 'split'
  const files: Array<{ name: string; bytes: Uint8Array }> = []

  for (const range of ranges) {
    const splitDoc = await PDFDocument.create()
    const pageIndexes = Array.from({ length: range.end - range.start + 1 }, (_, idx) => range.start - 1 + idx)
    const copiedPages = await splitDoc.copyPages(pdfDoc, pageIndexes)
    copiedPages.forEach((page) => splitDoc.addPage(page))
    const resultBytes = await splitDoc.save()
    files.push(await buildPdfFile(new Uint8Array(resultBytes), index, baseName))
    index += 1
  }

  await saveSplitFiles(files)
}

const splitByMaxSize = async (pdfBytes: Uint8Array, maxKb: number) => {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pageCount = pdfDoc.getPageCount()
  const baseName = selectedFile.value?.name.replace(/\.pdf$/i, '') ?? 'split'

  let currentGroup: number[] = []
  let index = 1
  const files: Array<{ name: string; bytes: Uint8Array }> = []

  const flushGroup = async () => {
    if (currentGroup.length === 0) return
    const splitDoc = await PDFDocument.create()
    const copiedPages = await splitDoc.copyPages(pdfDoc, currentGroup)
    copiedPages.forEach((page) => splitDoc.addPage(page))
    const resultBytes = await splitDoc.save()
    files.push(await buildPdfFile(new Uint8Array(resultBytes), index, baseName))
    index += 1
    currentGroup = []
  }

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const testGroup = [...currentGroup, pageIndex]
    const testDoc = await PDFDocument.create()
    const copied = await testDoc.copyPages(pdfDoc, testGroup)
    copied.forEach((page) => testDoc.addPage(page))
    const testBytes = await testDoc.save()
    const testSizeKb = testBytes.length / 1024

    if (testSizeKb <= maxKb || currentGroup.length === 0) {
      currentGroup = testGroup
      if (pageIndex === pageCount - 1) {
        await flushGroup()
      }
    } else {
      await flushGroup()
      currentGroup = [pageIndex]
      if (pageIndex === pageCount - 1) {
        await flushGroup()
      }
    }
  }

  await saveSplitFiles(files)
}

const handleSplit = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传一个 PDF 文件。')
    return
  }

  const fileBytes = new Uint8Array(await selectedFile.value.arrayBuffer())
  const doc = await PDFDocument.load(fileBytes)
  const pageCount = doc.getPageCount()

  cleanupResults()
  working.value = true

  try {
    if (splitMode.value === 'page') {
      const ranges = parseRanges(pageRanges.value, pageCount)
      await splitByRanges(fileBytes, ranges)
    } else {
      if (!maxSizeKb.value || maxSizeKb.value <= 0) {
        throw new Error('请设置每个 PDF 最大 KB，且该值必须大于 0。')
      }
      await splitByMaxSize(fileBytes, maxSizeKb.value)
    }
    ElMessage.success(`拆分完成，共生成 ${results.value.length} 个 PDF 文件。`)
  } catch (error) {
    const message = error instanceof Error ? error.message : '拆分出现错误，请检查输入。'
    ElMessage.error(message)
  } finally {
    working.value = false
  }
}
</script>

<style scoped>
.views-pdf {
  margin: 20px;
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 140px);
}
.sidebar {
  width: 300px;
  min-width: 240px;
}
.config-card,
.upload-card,
.result-card {
  padding: 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}
.config-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
}
.control-block {
  margin-top: 16px;
}
.control-label {
  margin-bottom: 8px;
  font-weight: 600;
}
.help-text {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
.action-btn {
  margin-top: 20px;
  width: 100%;
}
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(100vh - 120px);
  overflow: hidden;
}
.file-info {
  margin-top: 16px;
  color: #606266;
}
.result-card {
  max-height: 320px;
  overflow-y: auto;
}
.result-text {
  margin-bottom: 12px;
  color: #606266;
}
</style>
