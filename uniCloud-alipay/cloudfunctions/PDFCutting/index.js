'use strict';

const pdfLib = require('pdf-lib')

exports.main = async (event, context) => {
	const fileID = event.fileID
	const targetNumber = event.targetNumber
	// 函数将返回用于下载的云文件ID和状态字符串
	try {
		const result = await uniCloud.downloadFile({
			fileID: fileID
		})
		const PDFBuffer = new Uint8Array(result.fileContent)
		const PDFObj = await pdfLib.PDFDocument.load(PDFBuffer)
		const totalPages = PDFObj.getPageCount()
		// 如果只有一页则直接返回原文件的云文件ID
		if (totalPages === 1) {
			return {
				fileID: fileID,
				status: "success",
			}
		}
		if (targetNumber > 0 && targetNumber <= totalPages) {
			const PDFResult = await pdfLib.PDFDocument.create()
			const pageCopied = await PDFResult.copyPages(PDFObj, [targetNumber - 1])
			PDFResult.addPage(pageCopied[0])
			const PDFBytes = await PDFResult.save()
			const uploadObj = await uniCloud.uploadFile({
				fileContent: PDFBytes,
				cloudPath: `outputc/${Date.now()}_${Math.random().toString(36).substr(2,6)}_PDF.pdf`
			})
			return {
				fileID: uploadObj.fileID,
				status: "success",
			}
		} else {
			throw new Error()
		}
	} catch {
		return {
			fileID: null,
			status: "fail",
		}
	}
};