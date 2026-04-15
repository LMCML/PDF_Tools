<template>

	<view class="total">

		<view class="option_zone">
			<view class="title">
				<text class="title_text">- 工具选项 -</text>
			</view>
			<view class="options">
				<view class="buttons button_click" @click="selectSwitchingTool">
					<text class="buttons_text">图片/PDF转换</text>
				</view>
				<view class="buttons button_click" @click="selectCuttingTool">
					<text class="buttons_text">PDF剪切</text>
				</view>
				<view class="buttons button_click" @click="selectMergeTool">
					<text class="buttons_text">PDF拼接</text>
				</view>
			</view>
		</view>

		<view class="working_zone">
			<FormatSwitching class="components" v-if="switchingTool" />
			<PDFCutting class="components" v-if="cuttingTool" />
			<PDFMerge class="components" v-if="mergeTool" />
		</view>

	</view>

</template>

<script setup>
	import FormatSwitching from '@/components/FormatSwitching.vue'
	import PDFCutting from '@/components/PDFCutting.vue'
	import PDFMerge from '@/components/PDFMerge.vue'
	import {
		ref
	} from 'vue'

	const switchingTool = ref(false)
	const cuttingTool = ref(false)
	const mergeTool = ref(false)

	function selectSwitchingTool() {
		switchingTool.value = true
		cuttingTool.value = false
		mergeTool.value = false
	}

	function selectCuttingTool() {
		cuttingTool.value = true
		switchingTool.value = false
		mergeTool.value = false
	}

	function selectMergeTool() {
		mergeTool.value = true
		switchingTool.value = false
		cuttingTool.value = false

	}

	// const appBaseInfo = uni.getAppBaseInfo();
	// console.log('编译器版本 (uniCompilerVersion):', appBaseInfo.uniCompilerVersion);
	// console.log('运行时版本 (uniRuntimeVersion):', appBaseInfo.uniRuntimeVersion);
</script>

<style scoped>
	.total {
		box-sizing: border-box;
		display: grid;
		grid-template: 1fr 4fr/1fr;
		background-color: #f2e2ce;
		width: 100vw;
		min-height: 100vh;
	}

	.option_zone {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.title {
		display: flex;
		justify-content: center;
		margin-top: 30rpx;
		margin-bottom: 20rpx;
	}

	.title_text {
		color: #8d7a66;
		font-size: 48rpx;
		font-weight: bold;
	}

	.options {
		display: flex;
		justify-content: space-evenly;
	}

	.buttons {
		display: flex;
		justify-content: center;
		background-color: #e8c8a8;
		border: 6rpx solid #a58560;
		box-shadow: 0 6rpx 0 #7a664e,
			0 10rpx 0 rgba(0, 0, 0, 0.2);
		position: relative;
		transition: all linear 0.1s;
		width: 25%;
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
		font-size: 28rpx;
		font-weight: bold;
		color: #86633b;
	}

	.working_zone {
		display: flex;
		justify-content: center;
		width: 100%;
	}
</style>