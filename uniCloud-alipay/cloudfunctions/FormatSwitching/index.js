'use strict';

// const { request } = require('http');
const pdfLib = require('pdf-lib')

exports.main = async (event, context) => {
	const fileID = event.fileID
	const api = event.api
	// 函数将返回用于下载的云文件ID和状态字符串
	switch (api) {
		case 'switchToPDF':
			return switchToPDF(fileID)
		case 'switchToPic':
			return switchToPic(fileID)
		default:
			console.log("API传参有误")
	}
};

// 图片转PDF
async function switchToPDF(fileID) {
	const PDFObj = await pdfLib.PDFDocument.create()
	for (let pic of fileID) {
		try {
			const result = await uniCloud.downloadFile({
				fileID: pic
			})
			const picBuffer = new Uint8Array(result.fileContent)
			let picObj
			try {
				picObj = await PDFObj.embedJpg(picBuffer)
			} catch {
				picObj = await PDFObj.embedPng(picBuffer)
			}
			const pageObj = PDFObj.addPage([picObj.width, picObj.height])
			pageObj.drawImage(picObj, {
				x: 0,
				y: 0,
				width: picObj.width,
				height: picObj.height
			})
		} catch (error) {
			console.log("图片加载失败,跳过")
			continue
		}
	}
	if (PDFObj.getPageCount() === 0) {
		return {
			fileID: null,
			status: 'fail'
		}
	}
	const PDFBytes = await PDFObj.save()
	let uploadObj
	let uploadStatus
	try {
		uploadObj = await uniCloud.uploadFile({
			fileContent: PDFBytes,
			cloudPath: `outputpdf/${Date.now()}_${Math.random().toString(36).substr(2,6)}_PDF.pdf`
		})
		uploadStatus = "success"
	} catch {
		uploadStatus = "fail"
	}
	return {
		fileID: uploadObj.fileID,
		status: uploadStatus
	}
}

// PDF转图片
async function switchToPic(fileID) {
	const wsp = require('./lib/web-streams-polyfill')
	globalThis.ReadableStream = wsp.ReadableStream
	const dom = require("./lib/dommatrix/dist/dommatrix.js")
	globalThis.DOMMatrix = dom
	const pdfjsLib = require('./lib/pdfjs-dist/legacy/build/pdf.js')
	const canvas = require('@napi-rs/canvas')
	const picturesFileID = []
	let uploadStatus
	for (let PDFFile of fileID) {
		try {
			const result = await uniCloud.downloadFile({
				fileID: PDFFile
			})
			const PDFObj = await pdfjsLib.getDocument({
				data: result.fileContent
			}).promise
			for (let i = 1; i <= PDFObj.numPages; i++) {
				try {
					const pageObj = await PDFObj.getPage(i)
					const viewportInf = pageObj.getViewport({
						scale: 1.0
					})
					let canvasObj = canvas.createCanvas(viewportInf.width, viewportInf.height)
					const ctx = canvasObj.getContext("2d")
					await pageObj.render({
						canvasContext: ctx,
						viewport: viewportInf,
						background: 'white'
					}).promise
					const pictureObj = canvasObj.toBuffer("image/png")
					const uploadObj = await uniCloud.uploadFile({
						fileContent: pictureObj,
						cloudPath: `outputpic/${Date.now()}_${Math.random().toString(36).substr(2,6)}_Pic.png`
					})
					picturesFileID.push(uploadObj.fileID)
					canvasObj = null
				} catch {
					console.log("图片渲染失败，跳过")
					continue
				}
			}
		} catch(e) {
			console.log("PDF解析失败，跳过"+e)
			continue
		}
	}
	if (picturesFileID.length !== 0) {
		uploadStatus = "success"
	} else {
		uploadStatus = "fail"
	}
	return {
		fileID: picturesFileID,
		status: uploadStatus
	}
}