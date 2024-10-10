import React, { useState, useRef, useCallback, useMemo } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Input, Card, CardHeader, CardContent, Button, IconButton} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import {editLayout, saveLayout} from "../api/index"

import ReportRenderer from '../components/ReportRenderer'
import { useAuth } from '../auth/AuthContext';


const ComponentTypes = {
  TEXT: 'text',
  IMAGE: 'image',
  TABLE: 'table',
  GRAPH: 'graph',
};

const DraggableComponent = ({ type }) => {
    const [, drag] = useDrag(() => ({
      type: 'new',
      item: { type },
    }));
  
    return (
      <div ref={drag} className="p-2 m-2 bg-gray-200 rounded cursor-move">
        {type}
      </div>
    );
  };
  
  const LayoutComponent = ({ id, type, position, content, onMove, onUpdate, onDelete }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'existing',
      item: { id, type, position },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    const [isExpanded, setIsExpanded] = useState(false);

  
    const handleContentChange = (e) => {
      onUpdate(id, { content: e.target.value });
    };
  
    const renderContent = () => {
      switch (type) {
        case 'text':
          return <textarea value={content} onChange={handleContentChange} className="w-full shadow" />
        case 'image':
          return <Input type="text" value={content} onChange={handleContentChange} placeholder="Image URL" />;
        case 'table':
        case 'graph':
          return <div>Placeholder for {type} editor</div>;
        default:
          return null;
      }
    };
  
    return (
        <Card
        ref={drag}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          opacity: isDragging ? 0.5 : 1,
          width: '200px', // Adjust as needed
        }}
      >
        <CardHeader
          title={type}
          action={
            <IconButton
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: 'black' }}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        {isExpanded && (
          <CardContent>
            {renderContent()}
          </CardContent>
        )}
      </Card>
    );
  };
  
const getContent = (type) => {
    const urls = ["https://letsenhance.io/static/8f5e523ee6b2479e26ecc91b9c25261e/1015f/MainAfter.jpg"]
    const text = ["Sample text", "more sample text"]

    switch (type) {
        case 'text':
        return text[Math.floor(Math.random(0) * text.length)]
        case 'image':
        return urls[Math.floor(Math.random(0) * urls.length)]
        case 'table':
        return ""
        case 'graph': return ""
        default:
            return "";
    }
};

  const ReportBuilderContent = () => {
    const [layout, setLayout] = useState([]);
    const [isPreview, setIsPreview] = useState(false)
    //Move this into a Layout context for nicer state handling
    const [activeLayoutId, setActiveLayoutId] = useState(null)
    const [reportName, setReportName] = useState('');
    const dropRef = useRef(null);
    const {getToken} = useAuth()
    
    const previewLayout = useMemo(()=>{
        return layout.map((section)=>{
            return ({
                ...section,
                "content": getContent(section["type"])
            })
        })
    }, [layout])


    const moveComponent = useCallback((id, left, top) => {
      setLayout(prevLayout => 
        prevLayout.map(component => 
          component.id === id ? { ...component, position: { x: left, y: top } } : component
        )
      );
    }, []);
  
    const [, drop] = useDrop(() => ({
      accept: ['new', 'existing'],
      drop: (item, monitor) => {
        const dropPosition = monitor.getClientOffset();
        const containerRect = dropRef.current.getBoundingClientRect();
        const position = {
          x: dropPosition.x - containerRect.left,
          y: dropPosition.y - containerRect.top,
        };
  
        if (item.id) {
          // Move existing component
          moveComponent(item.id, position.x, position.y);
        } else {
          // Add new component
          setLayout(prevLayout => [...prevLayout, { 
            id: Date.now().toString(),
            type: item.type,
            position,
            content: '',
          }]);
        }
      },
    }), [moveComponent]);
  
    const updateComponent = (id, updates) => {
      setLayout(layout.map(component => 
        component.id === id ? { ...component, ...updates } : component
      ));
    };
  
    const deleteComponent = (id) => {
      setLayout(layout.filter(component => component.id !== id));
    };
  
    const handleSave = async () => {
        console.log(activeLayoutId)
        if (activeLayoutId){
            const response = await editLayout(reportName, activeLayoutId, layout, getToken())
            if (response.OK){
                setActiveLayoutId(response["layout_id"])
            }
            console.log('Edited layout successfully:', { name: reportName, layout });
        }else{
            const response = await saveLayout(reportName, layout, getToken())
            setActiveLayoutId(response["layout_id"])
            console.log('Saving layout:', { name: reportName, layout });
        }
    };
  
    return (
      <Card className="mx-auto mt-8">
        <CardHeader>
          <h2 className="text-2xl font-bold">Report Builder</h2>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <Input
              type="text"
              placeholder="Report Name"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="mr-2"
            />
            <Button onClick={handleSave}>Save Layout</Button>
            <Button onClick={() => setIsPreview(true)}>Preview Layout</Button>
          </div>
          <div className="flex">
            <Card className="w-1/4">
              <h3 className="mb-2 font-semibold">Components</h3>
              {Object.values(ComponentTypes).map((type) => (
                <DraggableComponent key={type} type={type} />
              ))}
            </Card>
            <div className="w-3/4">
              <h3 className="mb-2 font-semibold">Layout</h3>
              <div
                ref={(node) => {
                  drop(node);
                  dropRef.current = node;
                }}
                className="border-2 border-dashed border-gray-300 h-[600px] relative"
              >
                {layout.map((item) => (
                  <LayoutComponent
                    key={item.id}
                    {...item}
                    onMove={moveComponent}
                    onUpdate={updateComponent}
                    onDelete={deleteComponent}
                  />
                ))}
              </div>
            </div>
            <div className="w-2/5">
            {isPreview ?  <ReportRenderer layout={previewLayout} reportName={reportName}/> :<ReportRenderer layout={layout} reportName={reportName}/>}
          </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const ReportBuilder = () => (
    <DndProvider backend={HTML5Backend}>
      <ReportBuilderContent />
    </DndProvider>
  );
  
  export default ReportBuilder;