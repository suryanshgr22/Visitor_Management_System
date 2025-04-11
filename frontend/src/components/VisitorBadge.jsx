import React from 'react';

export default function VisitorBadge({ badgeData, onClose }) {
  const openBadgeWindow = () => {
    // Create a new window with a unique name
    const badgeWindow = window.open('', 'visitor_badge_window', 'width=600,height=800');
    
    // Write the HTML content to the new window
    badgeWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Visitor Badge - ${badgeData.fullname}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .badge {
              width: 400px;
              border: 2px solid #333;
              border-radius: 10px;
              padding: 20px;
              text-align: center;
              background-color: #f9f9f9;
            }
            .header {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 20px;
              color: #333;
            }
            .photo {
              width: 150px;
              height: 150px;
              border-radius: 50%;
              margin: 0 auto 20px;
              object-fit: cover;
              border: 3px solid #333;
            }
            .details {
              margin-bottom: 20px;
              text-align: left;
            }
            .detail-row {
              margin-bottom: 10px;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .qr-code {
              margin-top: 20px;
            }
            .qr-code img {
              width: 150px;
              height: 150px;
            }
            .print-button {
              margin-top: 20px;
              padding: 10px 20px;
              background-color: #4f46e5;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            .print-button:hover {
              background-color: #4338ca;
            }
            @media print {
              .print-button {
                display: none;
              }
              body {
                padding: 0;
              }
              .badge {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="badge">
            <div class="header">VISITOR BADGE</div>
            <img src="${badgeData.photo}" alt="${badgeData.fullname}" class="photo">
            <div class="details">
              <div class="detail-row">
                <span class="label">Name:</span> ${badgeData.fullname}
              </div>
              <div class="detail-row">
                <span class="label">Host:</span> ${badgeData.host}
              </div>
              <div class="detail-row">
                <span class="label">Purpose:</span> ${badgeData.purpose}
              </div>
              <div class="detail-row">
                <span class="label">Time:</span> ${badgeData.time}
              </div>
            </div>
            <div class="qr-code">
              <img src="${badgeData.qrCode}" alt="QR Code">
            </div>
          </div>
          <button class="print-button" onclick="window.print()">Print Badge</button>
        </body>
      </html>
    `);
    
    // Close the document to finish writing
    badgeWindow.document.close();
    
    // Close the modal in the parent window
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-4 max-w-md w-full my-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-medium">Visitor Badge Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        
        <div className="border rounded-lg p-3 mb-3 max-h-[70vh] overflow-y-auto">
          <div className="text-center mb-2">
            <h4 className="text-xl font-bold">VISITOR BADGE</h4>
          </div>
          
          {badgeData.photo && (
            <div className="flex justify-center mb-2">
              <img
                src={badgeData.photo}
                alt={badgeData.fullname}
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-300"
              />
            </div>
          )}
          
          <div className="space-y-1 mb-2">
            <div className="flex">
              <span className="font-semibold w-20">Name:</span>
              <span className="truncate">{badgeData.fullname}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-20">Host:</span>
              <span className="truncate">{badgeData.host}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-20">Purpose:</span>
              <span className="truncate">{badgeData.purpose}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-20">Time:</span>
              <span className="truncate">{badgeData.time}</span>
            </div>
          </div>
          
          {badgeData.qrCode && (
            <div className="flex justify-center">
              <img
                src={badgeData.qrCode}
                alt="QR Code"
                className="w-24 h-24"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={openBadgeWindow}
            className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Open Badge
          </button>
        </div>
      </div>
    </div>
  );
} 