export function picturesPreview(filePath, index) {
	uni.previewImage({
		urls: Array.isArray(filePath) ? filePath : [filePath],
		current: index,
		fail: (err) => {
			uni.showToast({
				duration: 1500,
				title: '无法打开',
				icon: 'error'
			})
		}
	})
}

export async function openFileToPreview(filePath) {
	try {
		await uni.openDocument({
			filePath: Array.isArray(filePath) ? filePath[0] : filePath,
			fileType: 'pdf'
		})
	} catch {
		uni.showToast({
			duration: 1500,
			title: '无法打开',
			icon: 'error'
		})
	}
}

export async function shareFileToChat(filePath) {
	try {
		await wx.shareFileMessage({
			filePath: Array.isArray(filePath) ? filePath[0] : filePath
		})
	} catch {
		uni.showToast({
			duration: 1500,
			title: '转发失败',
			icon: 'error'
		})
	}
}

export async function downloadToLocal(filePath) {
	try {
		for (let file of Array.isArray(filePath) ? filePath : [filePath]) {
			try {
				await uni.saveImageToPhotosAlbum({
					filePath: file
				})
			} catch {
				uni.showToast({
					duration: 750,
					title: '保存失败',
					icon: 'none'
				})
				if (err.errMsg.includes('auth deny')) {
					throw err
					// } else {
					// 	uni.previewImage({
					// 		urls: Array.isArray(filePath) ? filePath : [filePath]
					// 	})
				}
			}
		}
	} catch (err) {
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
}