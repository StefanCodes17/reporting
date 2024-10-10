import axios from 'axios'

export async function saveLayout(report_name, layout_raw, token){
    try {
        const response = await axios({
          method: 'post', 
          url: 'http://localhost:8000/report-layout', 
          headers: {
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json', 
          },
          data: {
            "name": report_name,
            "sections": layout_raw.map(section => (
                {
                    "name": section["type"],
                    "position": `${section["position"].x}-${section["position"].y}`,
                    "content": section["content"]
                }
            ))
        }
        });
        console.log('Response:', response.data); 
        return response.data
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
      }
}


export async function editLayout(report_name, layout_id, layout_raw, token){
    try {
        const response = await axios({
          method: 'post', 
          url: `http://localhost:8000/report-layout/${layout_id}`, 
          headers: {
            'Authorization': `Bearer ${token}`,  
            'Content-Type': 'application/json', 
          },
          data: {
            "name": report_name,
            "sections": layout_raw.map(section => (
                {
                    "name": section["type"],
                    "position": `${section["position"].x}-${section["position"].y}`,
                    "content": section["content"]
                }
            ))
        }
        });
        console.log('Response:', response.data); 
        return response.data
      } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
      }
}
