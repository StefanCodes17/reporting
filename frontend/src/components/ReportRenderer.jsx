import React from 'react';
import { Card, CardContent, CardHeader } from '@mui/material';

const ComponentRenderer = ({ type, content, position }) => {
  const style = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    maxWidth: '300px', // Adjust as needed
  };

  switch (type) {
    case 'text':
      return (
        <div style={style} className="p-2">
          <div>{content}</div>
        </div>
      );
    case 'image':
      return (
        <div style={style} className="p-2">
          <img src={content} alt="Report image" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      );
    case 'table':
      return (
        <div style={style} className="p-2 bg-white rounded shadow">
          <table className="border-collapse border">
            <tbody>
              {content ? content.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border p-1">{cell}</td>
                  ))}
                </tr>
              )): <tr key="admin">
                  <td key="0">
                    Please define a table
                  </td>
                </tr>}
            </tbody>
          </table>
        </div>
      );
    case 'graph':
      // Placeholder for graph rendering
      return (
        <div style={style} className="p-2 bg-white rounded shadow">
          <div className="bg-gray-200 p-4 text-center">
            Graph: {content}
          </div>
        </div>
      );
    default:
      return null;
  }
};

const ReportRenderer = ({ layout, reportName }) => {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <h2 className="text-2xl font-bold">{reportName || 'Untitled Report'}</h2>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-gray-300 h-[600px] relative">
          {layout.map((item) => (
            <ComponentRenderer
              key={item.id}
              type={item.type}
              content={item.content}
              position={item.position}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportRenderer;