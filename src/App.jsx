import React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from './db/supabaseClient';
import dimacoLogo from './assets/dimaco.gif';
//xlxs Support
import * as XLSX from 'xlsx';
import { read, writeFileXLSX } from "xlsx";
import { set_cptable } from "xlsx";
import * as cptable from "xlsx/dist/cpexcel.full.mjs";
set_cptable(cptable);
//zip Support
// import * as JSZip from "jszip";


function App() { 
    // const [todos, setTodos] = useState([]);
    const [percComp, setPercComp] = useState(0);
    const table = document.getElementById("table");

    const updateTable = (table, address, status) => {
		const row = document.createElement("div");
		row.style.display = "flex";
		row.style.alignItems = "center";
		row.style.padding = "5px";

		const addressElement = document.createElement("div");
		addressElement.innerText = address;
		addressElement.style.flex = 1;

		const statusElement = document.createElement("div");
		statusElement.innerText = status;

		row.appendChild(addressElement);
		row.appendChild(statusElement);
		table.appendChild(row);
	};

    const ssToJSON = () => {
		// Get the file input element from the DOM
		const fileInput = document.getElementById("upload");

		// Listen for changes to the file input
		fileInput.addEventListener("change", (event) => {
			const file = event.target.files[0];
			const reader = new FileReader();

			reader.onload = (e) => {
				const data = e.target.result;
				const workbook = XLSX.read(data, { type: "binary" });
				const firstSheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[firstSheetName];

				const headers = {};
				const addresses = [];

				// Get the row that contains the headers
				const headerRow = worksheet["!ref"].split(":")[0].match(/\d+/)[0];

				// Loop through the cells in the header row to get the header values
				for (let cell in worksheet) {
					if (cell[0] === headerRow) {
						headers[worksheet[cell].v] = cell.match(/[A-Z]+/)[0];
					}
				}

				// Check if all the required headers are present
				if (
					!headers.hasOwnProperty("PROPERTYADDRESS1") ||
					!headers.hasOwnProperty("PROPERTYADDRESS2") ||
					!headers.hasOwnProperty("PROPERTYCITY") ||
					!headers.hasOwnProperty("PROPERTYSTATE") ||
					!headers.hasOwnProperty("PROPERTYZIPCODE")
				) {
					console.error("Required headers are missing.");
					return;
				}

				// Loop through the rows to get the address values
				for (let row = headerRow + 1; row <= Object.keys(worksheet).pop().match(/\d+/); row++) {
					const address =
						worksheet[headers["PROPERTYADDRESS1"] + row].v +
						" " +
						worksheet[headers["PROPERTYADDRESS2"] + row].v +
						", " +
						worksheet[headers["PROPERTYCITY"] + row].v +
						", " +
						worksheet[headers["PROPERTYSTATE"] + row].v +
						" " +
						worksheet[headers["PROPERTYZIPCODE"] + row].v;

					addresses.push(address);
				}

				console.log(`const addresses = [${addresses.map((address) => `"${address}"`).join(", ")}];`);
			};

			reader.readAsBinaryString(file);
		});
        console.log("ss to json completed successfully")
	};

    const saveStreetViewImages = async (addresses) => {
		if (addresses.length > 25000) {
			throw new Error("Error: The maximum number of addresses that can be processed is 25,000.");
		}

		const API_KEY = "AIzaSyDgliks5Q2pxtUtSecn43s4hi0KN9Ve24c";
		const JSZip = await import("https://cdn.jsdelivr.net/npm/jszip@3.5.0/dist/jszip.min.js");
		const MAX_FILE_SIZE = 3.98e9; // 3.98 GB
		const zip = new JSZip();
		let currentZipSize = 0;
		let totalSize = 0;

		for (const address of addresses) {
			const url = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(
				address
			)}&key=${API_KEY}`;
            try {
			    const response = await fetch(url);
			    const imageBlob = await response.blob();
			    totalSize += imageBlob.size;
                updateTable(table, address, "imported");
            } catch (error) {
                console.log(error);
                updateTable(table, address, "failed");
            }
		}

		for (const [index, address] of addresses.entries()) {
			const url = `https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(
				address
			)}&key=${API_KEY}`;

            try {
                const response = await fetch(url);
                const imageBlob = await response.blob();

                // Check if adding the image will exceed the maximum file size
                if (currentZipSize + imageBlob.size > MAX_FILE_SIZE) {
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    const downloadButton = document.createElement("button");
                    downloadButton.innerText = `Download Part ${Math.floor(currentZipSize / MAX_FILE_SIZE) + 1}`;
                    downloadButton.onclick = () => {
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(zipBlob);
                        link.download = `street_view_images_part_${Math.floor(currentZipSize / MAX_FILE_SIZE) + 1}.zip`;
                        link.click();
                    };
                    document.body.appendChild(downloadButton);

                    // Reset the zip and current size for the next part
                    zip.removeAll();
                    currentZipSize = 0;
                }

                zip.file(`${address}.jpg`, imageBlob, { binary: true });
                currentZipSize += imageBlob.size;
                setPercComp((currentZipSize / totalSize) * 100).toFixed(2);
            } catch (error) {
                console.log(error);
                updateTable(table, address, "failed");
            }
		}

        try {
		const zipBlob = await zip.generateAsync({ type: "blob" });
		const downloadButton = document.createElement("button");
		downloadButton.innerText = `Download Part ${Math.floor(currentZipSize / MAX_FILE_SIZE) + 1}`;
		downloadButton.onclick = () => {
			const link = document.createElement("a");
			link.href = URL.createObjectURL(zipBlob);
			link.download = `street_view_images_part_${Math.floor(currentZipSize / MAX_FILE_SIZE) + 1}.zip`;
			link.click();
        }
        } catch (error) {
            console.log(error);
        }
		document.body.appendChild(downloadButton);
	};

    const handleSubmit = async (e) => {
        e.preventDefault();
        ssToJSON();
        await saveStreetViewImages();
    }

  return (
		<div className="container my-auto flex flex-col justify-center align-center p-8">
			<div className="row">
				<div className="logo">
					<img src={dimacoLogo} alt="Logo" />
				</div>
				<h1 className="text-[2.4rem] font-medium text-gray-800">Grab StreetView Images</h1>
				<a href="uploads" target="blank">
					<span className="text-[#007bff] absolute top-9 right-10">Manage Uploads</span>
				</a>
			</div>
			<div className="row border-dashed flex">
				{/* <div class="flex items-center justify-center w-1/2">
					<label
						for="dropzone-file"
						class="flex flex-col items-center w-full h-30 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-80 hover:bg-gray-100 ">
						<div class="flex flex-col items-center justify-center pt-5 pb-6">
							<svg
								aria-hidden="true"
								class="w-10 h-10 mb-3 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
							</svg>
							<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
								<span class="font-semibold">Click to upload</span> or drag and drop
							</p>
							<p class="text-xs text-gray-500 dark:text-gray-400">.Xlsx Only. (Max Addresses: 25000)</p>
						</div>
						<input id="upload" type="file" class="hidden" />
					</label>
				</div> */}

				<label
					className="block mb-2 font-medium text-gray-900 dark:text-white bg-[#004162] absolute w-38 text-lg px-4 py-1 -ml-1 rounded-lg cursor-pointer">
					Select File
				</label>
				<input
					className="block w-full text-lg text-gray-400 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none "
					id="upload"
					type="file"
				/>

				{/* <form
					id="upload-form"
					className="bg-white relative rounded-xl border-dashed border-2 border-gray-300 w-1/2 min-w-fit  pr-5 flex align-middle justify-center">
					<input id="upload" name="upload" type="file" className="cursor-pointer w-full h-full m-3" />
				</form> */}
				<button
					id="submit"
					className="w-fit bg-[#C1D72D] text-white py-1 px-2 rounded  h-fit my-auto ml-3 text-lg"
					onClick={handleSubmit}>
					Convert!
				</button>
			</div>
			<div className="row">
				<progress value="0" className="align-middle h-[1mm] rounded-full bg-[#eee] "></progress>
				<div id="result"></div>
			</div>
			<div id="table-container">
				<table id="table" className="max-h-28 overflow-y-scroll flex flex-col"></table>
			</div>{" "}
			<div className="row">
				<div id="zip-status"></div>
				<div id="zips"></div>
			</div>
		</div>
  );
}

export default App
