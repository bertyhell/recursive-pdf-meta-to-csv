import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import glob from "glob-promise";
const promptSync = require("prompt-sync");
const prompt = promptSync();

async function getPdfInfo(file: string): Promise<Record<string, string>> {
	const exec = promisify(require('child_process').exec);
	const output = await exec(`node_modules\\.bin\\pdf-meta-editor.cmd "${file}" -p`);
	const outputString = output.stdout.trim();
	const meta: Record<string, string> = {};
	outputString.split('\n').slice(1).map((line: string) => line.split(':')).forEach((keyValue: [string, string]) => {
		if (keyValue[1] && !keyValue[1].includes('undefined')) {
			meta[keyValue[0]] = keyValue[1];
		}
	});
	return meta;
}

async function getPdfInfos() {
	try {
		const pdfsDir = prompt("Enter pdf folder path. eg: C:\\Users\\Me\\Documents\\my-pdfs  : ");

		const files = await glob(path.join(pdfsDir, '**/*.pdf'));

		let csvString = 'FilePath;FileType;FileSize;FileModifyDate;FileAccessDate;FilePermissions;PDFVersion;PageCount;Linearized;CreateDate;Creator;Producer\n';
		for (let i = 0; i < files.length; i++) {
			try {
				const filePath = files[i];
				const info = await getPdfInfo(filePath);
				csvString += '"' + filePath + '";"' +
					info.FileType + '";"' +
					info.FileSize + '";"' +
					info.FileModifyDate + '";"' +
					info.FileAccessDate + '";"' +
					info.FilePermissions + '";"' +
					info.PDFVersion + '";"' +
					info.PageCount + '";"' +
					info.Linearized + '";"' +
					info.CreateDate + '";"' +
					info.Creator + '";"' +
					info.Producer + '"\n';
			} catch (err) {
				console.error('Failed to get metadata for file: ' + files[i], JSON.stringify(err));
			}
		}

		const dateFileName =new Date().toISOString().replace(/:/g, '-').replace('T', '_').replace('Z', '').split('.')[0];
		const csvPath = path.join(pdfsDir, 'pdf-meta-data_' + dateFileName + '.csv');
		await fs.writeFile(csvPath, csvString);
		console.log(`Done. Found ${files.length} files.`);
		console.log(`Wrote metadata to ` + csvPath);

		prompt("\n\nPress enter to close.");
	} catch (err) {
		console.error('error: ', JSON.stringify(err));
		prompt("\n\nPress enter to close.");
	}
}

getPdfInfos();
