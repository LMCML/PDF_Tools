<template>

	<view class="total">

		<view class="file_function">
			<view class="buttons button_click" @click="importFile">
				<text class="buttons_text">载入文件</text>
			</view>
		</view>

		<view class="file_function" :style="{ visibility: showFp ? 'visible'　:　'hidden' }">
			<view class="preview" v-if="clickToCheck" @click="openFileToPreview(fileResult)">
				<text class="preview_text">点击查看PDF</text>
			</view>
			<view class="preview" v-if="inImport">
				<view class="loading_graph loading_graph_animation"></view>
				<text class="loading_text">PDF载入中</text>
			</view>
			<view class="preview" v-if="inOperation">
				<view class="loading_graph loading_graph_animation"></view>
				<text class="loading_text">PDF处理中</text>
			</view>
			<view class="preview" v-if="inFail">
				<view class="loading_graph"></view>
				<text class="loading_text">操作失败</text>
			</view>
		</view>

		<view class="file_function">
			<view class="buttons button_click" :style="{ visibility: showGb ? 'visible'　:　'hidden' }"
				@click="shareFileToChat(fileResult)">
				<text class="buttons_text">导出文件</text>
			</view>
		</view>

	</view>

</template>

<script setup>
	import {
		ref
	} from 'vue'
	import {
		openFileToPreview,
		shareFileToChat
	} from '@/utils/DocumentOperations.js'

	// 控制按钮与预览区是否显示
	const showFp = ref(false)
	const showGb = ref(false)

	// 控制预览区内容的显示
	const clickToCheck = ref(false)
	const inImport = ref(false)
	const inOperation = ref(false)
	const inFail = ref(false)

	// 选择文件后缓存其本地路径
	const fileCache = ref([])
	// 前端文件上传至云储存后获得的文件ID
	const cloudFileID = ref([])
	// 处理后的文件的临时本地路径
	const fileResult = ref('')

	let whenImport = false
	async function importFile() {
		if (whenImport) {
			uni.showToast({
				duration: 1000,
				title: '载入操作中',
				icon: 'error'
			})
			return
		}
		whenImport = true
		initialize()
		// 从聊天记录获取文件
		wx.chooseMessageFile({
			count: 9,
			type: 'file',
			extension: ['.pdf'],
			// 选择成功
			success: async (res) => {
				for (let pdf of res.tempFiles) {
					fileCache.value.push(pdf.path)
				}
				showFp.value = true
				inImport.value = true
				// 上传至云端
				let functionStatus = await uploadToCloud()
				// 上传成功后呼叫云函数处理
				if (functionStatus === "success") {
					inImport.value = false
					inOperation.value = true
					try {
						const resultFileID = await uniCloud.callFunction({
							name: 'PDFMerge',
							data: {
								fileID: cloudFileID.value
							},
							timeout: 60000
						})
						if (resultFileID.result.status === "success") {
							let functionStatus = await downloadFromCloud(resultFileID.result.fileID)
							// 如果下载完成，则显示结果文件，否则显示失败画面
							if (functionStatus === "success") {
								inOperation.value = false
								clickToCheck.value = true
								showGb.value = true
							} else {
								inOperation.value = false
								inFail.value = true
							}
						} else {
							uni.showToast({
								duration: 1500,
								title: '处理失败',
								icon: 'error'
							})
							inOperation.value = false
							inFail.value = true
						}
					} catch {
						uni.showToast({
							duration: 1500,
							title: '处理失败',
							icon: 'error'
						})
						inOperation.value = false
						inFail.value = true
					}
					// 如果云上传失败，显示失败画面
				} else {
					inImport.value = false
					inFail.value = true
				}
				// 载入操作结束
				whenImport = false
			},
			// 选择失败
			fail: (err) => {
				uni.showToast({
					duration: 1500,
					title: '操作无效',
					icon: 'error'
				})
				// 载入操作结束
				whenImport = false
			}
		})
	}

	function initialize() {
		fileCache.value = []
		cloudFileID.value = []
		fileResult.value = ''
		showFp.value = false
		showGb.value = false
		clickToCheck.value = false
		inImport.value = false
		inOperation.value = false
		inFail.value = false
	}

	// 上传函数。已执行把上传内容推入cloudFileID数组
	async function uploadToCloud() {
		try {
			if (fileCache.value.length === 0) throw new Error()
			for (let file of fileCache.value) {
				const result = await uniCloud.uploadFile({
					filePath: file,
					cloudPath: `temp/${Date.now()}_${Math.random().toString(36).substr(2,6)}`
				})
				cloudFileID.value.push(result.fileID)
			}
			return "success"
		} catch {
			uni.showToast({
				duration: 1500,
				title: '上传失败',
				icon: 'error'
			})
			return "fail"
		}
	}

	// 下载函数。已执行把下载内容设为fileResult
	async function downloadFromCloud(fileID) {
		try {
			const fileURL = await uniCloud.getTempFileURL({
				fileList: [fileID]
			})
			const result = await uni.downloadFile({
				url: fileURL.fileList[0].tempFileURL
			})
			if (result.statusCode !== 200) throw new Error()
			fileResult.value = result.tempFilePath
			return "success"
		} catch {
			uni.showToast({
				duration: 1500,
				title: '下载失败',
				icon: 'error'
			})
			return "fail"
		}
	}
</script>

<style scoped>
	@keyframes in_loading {
		25% {}

		100% {
			transform: rotate(360deg);
		}

	}

	.total {
		box-sizing: border-box;
		display: grid;
		grid-template: 1fr/1fr 2fr 1fr;
		height: 15%;
	}

	.file_function {
		display: flex;
		flex-direction: column;
		margin-left: 20rpx;
		margin-right: 20rpx;
	}

	.buttons {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 10rpx;
		margin-bottom: 10rpx;
		background-color: #e8c8a8;
		border: 6rpx solid #a58560;
		box-shadow: 0 6rpx 0 #7a664e,
			0 10rpx 0 rgba(0, 0, 0, 0.2);
		position: relative;
		transition: all linear 0.2s;
		width: 100%;
		flex: 1;
	}

	.button_click:active {
		transform: translateY(2px);
		border: 6rpx solid #d1a879;
		box-shadow: 0 4rpx 0 #9e876a,
			0 8rpx 0 rgba(0, 0, 0, 0.2);
		transition: transform linear 0s;
	}

	.buttons_text {
		user-select: none;
		font-size: 30rpx;
		font-weight: bold;
		color: #86633b;
	}

	.preview {
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #f8efe2;
		border: 8rpx double #86633b;
		outline: 4rpx solid #f4daad;
		height: 100%;
		width: 100%;
		gap: 10rpx;
	}

	.preview_text {
		user-select: none;
		font-size: 36rpx;
		font-weight: bold;
		color: #ee5959;
		text-decoration: underline;
		white-space: nowrap;
	}

	.loading_graph {
		background-color: #ee5959;
		width: 10%;
		aspect-ratio: 1 / 1;
	}

	.loading_graph_animation {
		animation: in_loading 1.5s ease infinite;
	}

	.loading_text {
		user-select: none;
		font-size: 28rpx;
		font-weight: bold;
		color: #ee5959;
		white-space: nowrap;
	}
</style>