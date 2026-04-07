<template>
	<view class="total">

		<view class="file_function">

			<view class="buttons" :class="{ 'button_click': !typeSelecting }" @click="typeSelect">
				<text class="buttons_text">载入文件</text>
				<view class="button_mask" :style="{ visibility: showButtonMask ? 'visible' : 'hidden' }" @click.stop>
					<text class="buttons_text">载入文件</text>
				</view>
				<view class="sub_buttons" :class="{ 'show_sub_buttons': showSubButtons }"
					:style="{ visibility: showSubButtons ? 'visible' : 'hidden' }" @click.stop>
					<view class="to_pdf" @click.stop="importFile('to_pdf')">
						<text class="sub_text">图片转为PDF</text>
					</view>
					<view class="to_pic" @click.stop="importFile('to_pic')">
						<text class="sub_text">PDF转为图片</text>
					</view>
				</view>
			</view>

			<view class="import_file_preview" :style="{ visibility: showIfp ? 'visible' : 'hidden' }">
				<view class="loading_zone " v-if="showIfpLoad">
					<view class="loading_graph"
						:class="{ 'loading_graph_animation': usingAnimation, 'loading_graph_red': iGraphRed, 'loading_graph_grey': iGraphGrey }">
					</view>
					<text class="loading_text"
						:class="{ 'loading_text_red': iGraphRed, 'loading_text_grey': iGraphGrey }">{{ fileImport }}</text>
				</view>
				<view class="preview_zone" v-if="iShowPicPre || iShowPDFPre">
					<view class="preview_img" v-if="iShowPicPre" v-for="(res, index) in fileCache" :key="index"
						@click="picturesPreview(fileCache, index)">
						<image class="preview_img_items" :src="res" alt="预览图片" mode="aspectFit" />
					</view>
					<view class="preview_PDF" v-if="iShowPDFPre" @click="openFileToPreview(fileCache)">
						<text class="preview_text">点击查看PDF</text>
					</view>
				</view>
			</view>
		</view>

		<view class="file_function">
			<view class="get_file_preview" :style="{ visibility: showGfp ? 'visible' : 'hidden' }">
				<view class="loading_zone " v-if="showGfpLoad">
					<view class="loading_graph"
						:class="{ 'loading_graph_animation': usingAnimation, 'loading_graph_red': gGraphRed, 'loading_graph_grey': gGraphGrey }">
					</view>
					<text class="loading_text"
						:class="{ 'loading_text_red': gGraphRed, 'loading_text_grey': gGraphGrey }">{{ fileGet }}</text>
				</view>
				<view class="preview_zone" v-if="gShowPicPre || gShowPDFPre">
					<view class="preview_img" v-if="gShowPicPre" v-for="(res, index) in fileResultList" :key="index"
						@click="picturesPreview(fileResultList, index)">
						<image class="preview_img_items" :src="res" alt="预览图片" mode="aspectFit" />
					</view>
					<view class="preview_PDF" v-if="gShowPDFPre" @click="openFileToPreview(fileResultList)">
						<text class="preview_text">点击查看PDF</text>
					</view>
				</view>
			</view>

			<view class="buttons button_click" :style="{ visibility: showGb ? 'visible' : 'hidden' }"
				@click="shouldDownloadLocal ? downloadToLocal(fileResultList) : shareFileToChat(fileResultList)">
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
		picturesPreview,
		openFileToPreview,
		shareFileToChat,
		downloadToLocal
	} from '@/utils/DocumentOperations.js'

	// 控制载入按钮的样式
	const typeSelecting = ref(false)
	const showButtonMask = ref(false)
	const showSubButtons = ref(false)

	// 控制按钮与预览区是否显示
	const showIfp = ref(false)
	const showGfp = ref(false)
	const showGb = ref(false)

	// 控制预览区加载画面是否显示
	const showIfpLoad = ref(false)
	const showGfpLoad = ref(false)

	// 控制预览区的加载画面中的动画
	const usingAnimation = ref(false)
	const iGraphRed = ref(false)
	const iGraphGrey = ref(false)
	const gGraphRed = ref(false)
	const gGraphGrey = ref(false)

	// 控制预览区的加载画面中的文本
	const fileImport = ref(null)
	const fileGet = ref(null)

	// 控制载入预览区加载预览内容
	const iShowPicPre = ref(false)
	const iShowPDFPre = ref(false)

	// 控制获取预览区加载预览内容
	const gShowPicPre = ref(false)
	const gShowPDFPre = ref(false)
	
	// 根据模式选择保存方式
	const shouldDownloadLocal = ref(null)

	// 选择文件后缓存其本地路径
	const fileCache = ref([])
	// 前端文件上传至云储存后获得的文件ID
	const cloudFileID = ref([])
	// 处理后的文件的临时本地路径
	const fileResultList = ref([])

	let whenImport = false
	async function importFile(event) {
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
		// 选择图片转为PDF
		if (event === "to_pdf") {
			fileImport.value = "载入图片中"
			fileGet.value = "获取PDF中"
			// 选择图片来源
			uni.showActionSheet({
				itemList: ['相册中选择', '聊天记录中选择'],
				success: (res) => {
					// 相册中选择图片
					if (res.tapIndex === 0) {
						uni.chooseImage({
							sourceType: ['album'],
							// 相册中选择图片，成功
							success: async (res) => {
								for (let pic of res.tempFilePaths) {
									try {
										const info = await uni.getImageInfo({
											src: pic
										});
										if (info.type && ['jpg', 'jpeg', 'png'].includes(info
												.type.toLowerCase())) {
											fileCache.value.push(pic)
										}
									} catch {
										continue
									}
								}
								// 相册中选择图片，重置载入按钮
								resetButtons()
								// 显示载入预览区
								showIfp.value = true
								// 显示载入预览区的载入动画
								useLoadingToPDF("i", true)
								// 如果至少有一个文件被载入，相册中选择图片，上传
								if (fileCache.value.length !== 0) {
									let functionStatus = await uploadToCloud()
									// 如果云上传成功，相册中选择图片，呼叫云函数处理
									if (functionStatus === "success") {
										// 显示载入预览区的图片
										useLoadingToPDF("i", false)
										iShowPicPre.value = true
										// 显示获取预览区
										showGfp.value = true
										// 显示获取预览区的载入动画
										useLoadingToPDF("g", true)
										let resultFileID
										try {
											resultFileID = await uniCloud.callFunction({
												name: 'FormatSwitching',
												data: {
													fileID: cloudFileID.value,
													api: 'switchToPDF'
												},
												timeout: 30000
											})
										} catch {
											resultFileID = {
												result: {
													status: 'fail'
												}
											}
										}
										// 如果云函数处理成功，相册中选择图片，下载，否则下载为失败
										if (resultFileID.result.status === "success") {
											functionStatus = await downloadFromCloud(
												resultFileID.result.fileID)
										} else {
											functionStatus = "fail"
											uni.showToast({
												duration: 1500,
												title: '处理失败',
												icon: 'error'
											})
										}
										// 如果下载完成，相册中选择图片，显示结果文件，否则显示获取失败
										if (functionStatus === "success") {
											useLoadingToPDF("g", false)
											gShowPDFPre.value = true
											showGb.value = true
											shouldDownloadLocal.value = false
										} else {
											usingAnimation.value = false
											fileGet.value = "获取失败"
										}
										// 如果云上传失败，相册中选择图片，显示载入失败。结束
									} else {
										usingAnimation.value = false
										fileImport.value = "载入失败"
									}
									// 如果没有任何文件成功载入，相册中选择图片，显示载入失败。结束
								} else {
									uni.showToast({
										duration: 1500,
										title: '载入无效',
										icon: 'error'
									})
									usingAnimation.value = false
									fileImport.value = "载入失败"
								}
								// 载入操作结束
								whenImport = false
							},
							// 相册中选择图片，失败
							fail: (err) => {
								uni.showToast({
									duration: 1500,
									title: '操作无效',
									icon: 'error'
								})
								// 相册中选择图片，失败后重置
								resetButtons()
								// 载入操作结束
								whenImport = false
								// 相册中选择图片，权限提示
								if (err.errMsg.includes('auth deny')) {
									uni.showModal({
										title: '提示',
										content: '需要设置权限，是否前去设置',
										confirmText: '是',
										cancelText: '否',
										success: (res) => {
											if (res.confirm) {
												uni.openSetting();
											}
										}
									});
								}
							}
						})
						// 聊天记录中选择图片
					} else if (res.tapIndex === 1) {
						wx.chooseMessageFile({
							count: 9,
							type: 'image',
							// 聊天记录中选择图片，成功
							success: async (res) => {
								for (let pic of res.tempFiles) {
									try {
										const info = await uni.getImageInfo({
											src: pic.path
										});
										if (info.type && ['jpg', 'jpeg', 'png'].includes(info
												.type.toLowerCase())) {
											fileCache.value.push(pic.path)
										}
									} catch {
										console.log("图片载入失败,跳过")
										continue
									}
								}
								// 聊天记录中选择图片，重置载入按钮
								resetButtons()
								// 显示载入预览区
								showIfp.value = true
								// 显示载入预览区的载入动画
								useLoadingToPDF("i", true)
								// 如果至少有一个文件被载入，聊天记录中选择图片，上传
								if (fileCache.value.length !== 0) {
									let functionStatus = await uploadToCloud()
									// 如果云上传成功，聊天记录中选择图片，呼叫云函数处理
									if (functionStatus === "success") {
										// 显示载入预览区的图片
										useLoadingToPDF("i", false)
										iShowPicPre.value = true
										// 显示获取预览区
										showGfp.value = true
										// 显示获取预览区的载入动画
										useLoadingToPDF("g", true)
										let resultFileID
										try {
											resultFileID = await uniCloud.callFunction({
												name: 'FormatSwitching',
												data: {
													fileID: cloudFileID.value,
													api: 'switchToPDF'
												},
												timeout: 30000
											})
										} catch {
											resultFileID = {
												result: {
													status: 'fail'
												}
											}
										}
										// 如果云函数处理成功，聊天记录中选择图片，下载，否则下载为失败
										if (resultFileID.result.status === "success") {
											functionStatus = await downloadFromCloud(
												resultFileID
												.result.fileID)
										} else {
											functionStatus = "fail"
											uni.showToast({
												duration: 1500,
												title: '处理失败',
												icon: 'error'
											})
										}
										// 如果下载完成，聊天记录中选择图片，显示结果文件，否则显示获取失败
										if (functionStatus === "success") {
											useLoadingToPDF("g", false)
											gShowPDFPre.value = true
											showGb.value = true
											shouldDownloadLocal.value = false
										} else {
											usingAnimation.value = false
											fileGet.value = "获取失败"
										}
										// 如果云上传失败，聊天记录中选择图片，显示载入失败。结束
									} else {
										usingAnimation.value = false
										fileImport.value = "载入失败"
									}
									// 如果没有任何文件成功载入，聊天记录中选择图片，显示载入失败。结束
								} else {
									uni.showToast({
										duration: 1500,
										title: '载入无效',
										icon: 'error'
									})
									usingAnimation.value = false
									fileImport.value = "载入失败"
								}
								// 载入操作结束
								whenImport = false
							},
							// 聊天记录中选择图片，失败
							fail: (err) => {
								uni.showToast({
									duration: 1500,
									title: '操作无效',
									icon: 'error'
								})
								// 聊天记录中选择图片，失败后重置
								resetButtons()
								// 载入操作结束
								whenImport = false
								// 聊天记录中选择图片，权限提示
								if (err.errMsg.includes('auth deny')) {
									uni.showModal({
										title: '提示',
										content: '需要设置权限，是否前去设置',
										confirmText: '是',
										cancelText: '否',
										success: (res) => {
											if (res.confirm) {
												uni.openSetting();
											}
										}
									});
								}
							}
						})
					}
				},
				// 进入来源选择模式失败
				fail: (err) => {
					uni.showToast({
						duration: 750,
						title: '操作无效',
						icon: 'error'
					})
					resetButtons()
					// 载入操作结束
					whenImport = false
				}
			})
			// 选择PDF转为图片
		} else if (event === ("to_pic")) {
			fileImport.value = "载入PDF中"
			fileGet.value = "获取图片中"
			// 聊天记录中选择PDF
			wx.chooseMessageFile({
				count: 9,
				type: 'file',
				extension: ['.pdf'],
				// 聊天记录中选择PDF，成功
				success: async (res) => {
					for (let file of res.tempFiles) {
						fileCache.value.push(file.path)
					}
					// 聊天记录中选择PDF，重置载入按钮
					resetButtons()
					// 显示载入预览区
					showIfp.value = true
					// 显示载入预览区的载入动画
					useLoadingToPic("i", true)
					// 聊天记录中选择PDF,上传
					let functionStatus = await uploadToCloud()
					// 如果云上传成功，聊天记录中PDF，呼叫云函数处理
					if (functionStatus === "success") {
						// 显示载入预览区的图片
						useLoadingToPic("i", false)
						iShowPDFPre.value = true
						// 显示获取预览区
						showGfp.value = true
						// 显示获取预览区的载入动画
						useLoadingToPic("g", true)
						let resultFileID
						try {
							resultFileID = await uniCloud.callFunction({
								name: 'FormatSwitching',
								data: {
									fileID: cloudFileID.value,
									api: 'switchToPic'
								},
								timeout: 60000
							})
						} catch {
							resultFileID = {
								result: {
									status: 'fail'
								}
							}
						}
						// 如果云函数处理成功，聊天记录中选择PDF，下载，否则下载为失败
						if (resultFileID.result.status === "success") {
							functionStatus = await downloadFromCloud(resultFileID.result.fileID)
						} else {
							functionStatus = "fail"
							uni.showToast({
								duration: 1500,
								title: '处理失败',
								icon: 'error'
							})
						}
						// 如果下载完成，聊天记录中选择PDF，显示结果文件，否则显示获取失败
						if (functionStatus === "success") {
							useLoadingToPic("g", false)
							gShowPicPre.value = true
							showGb.value = true
							shouldDownloadLocal.value = true
						} else {
							usingAnimation.value = false
							fileGet.value = "获取失败"
						}
						// 如果云上传失败，聊天记录中选择PDF，显示载入失败。结束
					} else {
						usingAnimation.value = false
						fileImport.value = "载入失败"
					}
					// 载入操作结束
					whenImport = false
				},
				// 聊天记录中选择PDF，失败
				fail: (err) => {
					uni.showToast({
						duration: 1500,
						title: '操作无效',
						icon: 'error'
					})
					// 聊天记录中选择PDF，失败后重置
					resetButtons()
					// 载入操作结束
					whenImport = false
					// 聊天记录中选择PDF，权限提示
					if (err.errMsg.includes('auth deny')) {
						uni.showModal({
							title: '提示',
							content: '需要设置权限，是否前去设置',
							confirmText: '是',
							cancelText: '否',
							success: (res) => {
								if (res.confirm) {
									uni.openSetting();
								}
							}
						});
					}
				}
			})
		}
	}

	function resetButtons() {
		showButtonMask.value = false
		showSubButtons.value = false
		typeSelecting.value = false
	}

	function typeSelect() {
		if (typeSelecting.value) return
		typeSelecting.value = true
		setTimeout(() => {
			showButtonMask.value = true
			setTimeout(() => {
				showSubButtons.value = true
			}, 50)
		}, 100)
	}

	function useLoadingToPDF(mode, start) {
		if (mode === "i") {
			if (start) {
				showIfpLoad.value = true
				usingAnimation.value = true
				iGraphGrey.value = true
			} else {
				showIfpLoad.value = false
				usingAnimation.value = false
				iGraphGrey.value = false
			}
		} else if (mode === "g") {
			if (start) {
				showGfpLoad.value = true
				usingAnimation.value = true
				gGraphRed.value = true
			} else {
				showGfpLoad.value = false
				usingAnimation.value = false
				gGraphRed.value = false
			}
		} else {
			console.log("加载动画传参有误")
		}
	}

	function useLoadingToPic(mode, start) {
		if (mode === "i") {
			if (start) {
				showIfpLoad.value = true
				usingAnimation.value = true
				iGraphRed.value = true
			} else {
				showIfpLoad.value = false
				usingAnimation.value = false
				iGraphRed.value = false
			}
		} else if (mode === "g") {
			if (start) {
				showGfpLoad.value = true
				usingAnimation.value = true
				gGraphGrey.value = true
			} else {
				showGfpLoad.value = false
				usingAnimation.value = false
				gGraphGrey.value = false
			}
		}
	}

	function initialize() {
		fileCache.value = []
		cloudFileID.value = []
		fileResultList.value = []
		showIfp.value = false
		showGfp.value = false
		showGb.value = false
		shouldDownloadLocal.value = null
		showIfpLoad.value = false
		showGfpLoad.value = false
		usingAnimation.value = false
		iGraphGrey.value = false
		iGraphRed.value = false
		gGraphGrey.value = false
		gGraphRed.value = false
		iShowPicPre.value = false
		iShowPDFPre.value = false
		gShowPicPre.value = false
		gShowPDFPre.value = false
		fileImport.value = null
		fileGet.value = null
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

	// 下载函数。已执行把下载内容推入fileResultList数组
	async function downloadFromCloud(fileID) {
		try {
			const fileURLList = await uniCloud.getTempFileURL({
				fileList: Array.isArray(fileID) ? fileID : [fileID]
			})
			for (const fileURL of fileURLList.fileList) {
				try {
					const result = await uni.downloadFile({
						url: fileURL.tempFileURL
					})
					if (result.statusCode !== 200) throw new Error()
					fileResultList.value.push(result.tempFilePath)
				} catch {
					console.log("资源下载失败，跳过")
					continue
				}
			}
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
	@keyframes show_sub_buttons {
		0% {}

		100% {
			transform: translateX(295rpx);
		}

	}

	@keyframes in_loading {
		25% {}

		100% {
			transform: rotate(360deg);
		}

	}

	.total {
		box-sizing: border-box;
		display: grid;
		grid-template: 1fr/1fr 1fr;
		height: 75%;
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
		box-shadow: 0 3px 0 #7a664e,
			0 5px 0 rgba(0, 0, 0, 0.2);
		position: relative;
		transition: all linear 0.2s;
		min-width: 200rpx;
		flex: 1;
	}

	.button_click:active {
		transform: translateY(2px);
		border: 6rpx solid #d1a879;
		box-shadow: 0 2px 0 #9e876a,
			0 4px 0 rgba(0, 0, 0, 0.2);
		transition: transform linear 0s;
	}

	.buttons_text {
		user-select: none;
		font-size: 40rpx;
		font-weight: bold;
		color: #86633b;
	}

	.button_mask {
		box-sizing: unset;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: #e8c8a8;
		border: 6rpx solid #a58560;
		position: absolute;
		height: 100%;
		width: 100%;
		z-index: 1;
	}

	.sub_buttons {
		display: flex;
		position: absolute;
		justify-content: space-between;
		align-items: center;
		gap: 10rpx;
		background-color: #a58560;
		border: 6rpx solid #a58560;
		outline: 4rpx solid #f4daad;
		outline-offset: 2rpx;
		right: 0;
	}

	.show_sub_buttons {
		animation: show_sub_buttons 0.5s ease forwards;
	}

	.to_pdf,
	.to_pic {
		display: flex;
		align-items: center;
		background-color: #e8c8a8;
	}

	.sub_text {
		user-select: none;
		font-size: 24rpx;
		font-weight: bold;
		color: #86633b;
		white-space: nowrap;
	}

	.import_file_preview,
	.get_file_preview {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 50rpx;
		margin-bottom: 50rpx;
		background-color: #f8efe2;
		border: 8rpx double #86633b;
		outline: 4rpx solid #f4daad;
		outline-offset: 2rpx;
		flex: 9;
	}

	.loading_zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10rpx;
		width: 20%;
		aspect-ratio: 1 / 1;
	}

	.loading_graph {
		background-color: #ee5959;
		height: 60%;
		width: 60%;
	}

	.loading_graph_animation {
		animation: in_loading 1.5s ease infinite;
	}

	.loading_graph_red {
		background-color: #ee5959;
	}

	.loading_graph_grey {
		background-color: #bfbfbf;
	}

	.loading_text {
		user-select: none;
		font-size: 24rpx;
		white-space: nowrap;
	}

	.loading_text_red {
		color: #ee5959;
	}

	.loading_text_grey {
		color: #bfbfbf;
	}

	.preview_zone {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(50%, 1fr));
		grid-auto-rows: auto;
		height: 100%;
		width: 100%;
	}

	.preview_img {
		display: flex;
		position: relative;
		height: 100%;
		width: 100%;
	}

	.preview_img_items {
		user-select: none;
		position: absolute;
		justify-self: center;
		align-self: center;
		max-height: 100%;
		max-width: 100%;
	}

	.preview_PDF {
		display: flex;
		justify-content: center;
		align-items: center;
		justify-self: center;
		align-self: center;
		height: 100%;
		width: 100%;
	}

	.preview_text {
		user-select: none;
		font-size: 36rpx;
		font-weight: bold;
		color: #ee5959;
		text-decoration: underline;
		white-space: nowrap;
	}
</style>