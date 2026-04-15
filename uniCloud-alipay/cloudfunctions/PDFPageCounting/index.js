'use strict';

const pdfLib = require('pdf-lib')

exports.main = async (event, context) => {
	const fileID = event.fileID
	try {
		const result = await uniCloud.downloadFile({
			fileID: fileID
		})
		const PDFBuffer = new Uint8Array(result.fileContent)
		const PDFObj = await pdfLib.PDFDocument.load(PDFBuffer)
		const totalPages = PDFObj.getPageCount()
		return totalPages
	} catch {
		return 0
	}
};