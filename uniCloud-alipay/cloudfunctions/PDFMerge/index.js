'use strict';

const pdfLib = require('pdf-lib')

exports.main = async (event, context) => {
	const fileID = event.fileID
	// 如果只有一个文件被上传则直接返回原文件的云文件ID
	if (fileID.length === 1) {
		return {
			fileID: fileID[0],
			status: "success",
		}
	}
	// 函数将返回用于下载的云文件ID和状态字符串
	let PDFBytes
	try {
		const fileMerged = await pdfLib.PDFDocument.create()
		for (let file of fileID) {
			try {
				const result = await uniCloud.downloadFile({
					fileID: file
				})
				const PDFBuffer = new Uint8Array(result.fileContent)
				const PDFObj = await pdfLib.PDFDocument.load(PDFBuffer)
				const pageCopied = await fileMerged.copyPages(PDFObj, PDFObj.getPageIndices())
				for (let page of pageCopied) {
					try {
						fileMerged.addPage(page)
					} catch {
						console.log("页面加载失败,跳过")
						continue
					}
				}
			} catch {
				console.log("文件复制失败,跳过")
				continue
			}
		}
		if (fileMerged.getPageCount() === 0) {
			return {
				fileID: null,
				status: "fail",
			}
		}
		PDFBytes = await fileMerged.save()
	} catch {
		return {
			fileID: null,
			status: "fail",
		}
	}
	try {
		const uploadObj = await uniCloud.uploadFile({
			fileContent: PDFBytes,
			cloudPath: `outputm/${Date.now()}_${Math.random().toString(36).substr(2,6)}_PDF.pdf`
		})
		return {
			fileID: uploadObj.fileID,
			status: "success",
		}
	} catch {
		return {
			fileID: null,
			status: "fail",
		}
	}
};