import React, { useState, useEffect, useContext, useRef} from 'react';
import {AppContext} from './appContext';

import { PropDoughnutChart } from './PropDoughnutChart';

import {DataTable, Button, Dropdown, ExportIcon, EditIcon, Pagination, TextInput, useTheme } from '@bigfix-ui/core';

export const MainPage = ({computerData}) => {

    const {appContext, setAppContext} = useContext(AppContext);
    const [theme] = useTheme();

    // pagination data
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [page, setPage] = useState(0);

    const [filterObj, setFilterObj] = useState({})


    // control table rows that have more than 3 results (expand, collapse)
    const [expandedRows, setExpandedRows] = useState([])
    const modifyRowExpansion = (id) => {

        let newExpandedRows = [];
       
        if (expandedRows.includes(id)) {
            newExpandedRows = expandedRows.filter(compId => compId !== id)
        } else {
            newExpandedRows = [...expandedRows, id]
        }
        setExpandedRows([...newExpandedRows]);
    }
    
    const [computerList, setComputerList] = useState(computerData);
    
    const propNames = {
        scanVersion: 'Scanner Version',
        lastScanTime: 'Last Scan Time',
        vulnFileCount: 'Vulnerable',
        potVulnFileCount: 'Potentially Vulnerable',
        mitigatedFileCount: 'Mitigated',
        fileResultDetails: 'File Result Details',
        scanDuration: 'Scan Duration',
        versionsFound: 'Versions Found',
    };

    const charts =  {
        'scanVersion': 'Detection Scanner Version',
        'vulnFileCount': 'Vulnerable  File Count Per Computer',
        'mitigatedFileCount': 'Mitigated  File Count Per Computer',
        'versionsFound': 'Log4j Versions Found',

    }
    const [selectedChart, setSelectedChart] = useState('scanVersion')
    //chart color data:
    const backgroundColor = [
        'rgba(0,102,0,' + theme['chart-background-opacity'] + ' )',
        'rgba(179,0,0,' + theme['chart-background-opacity'] + ' )',
        'rgba(153,138,1,' + theme['chart-background-opacity'] + ' )',
        'rgba(13,108,175,' + theme['chart-background-opacity'] + ' )',
        'rgba(153,102,255,' + theme['chart-background-opacity'] + ' )',
        'rgba(255,159,64,' + theme['chart-background-opacity'] + ' )',
    ]
    const borderColor =  [
        'rgba(0,102,0,1)',
        'rgba(179,0,0,1)',
        'rgba(153,138,1,1)', 
        'rgba(13,108,175,1)',
        'rgba(153,102,255,1)',
        'rgba(255,159,64,1)',
    ]
    const hoverBackgroundColor = [
        'rgba(0,102,0,' + theme['chart-hover-opacity'] + ' )',
        'rgba(179,0,0,' + theme['chart-hover-opacity'] + ' )',
        'rgba(153,138,1,' + theme['chart-hover-opacity'] + ' )',
        'rgba(13,108,175,' + theme['chart-hover-opacity'] + ' )',
        'rgba(153,102,255,' + theme['chart-hover-opacity'] + ' )',
        'rgba(255,159,64,' + theme['chart-hover-opacity'] + ' )',
    ]
    const hoverBorderColor = [
        'rgba(0,102,0,1)',
        'rgba(179,0,0,1)',
        'rgba(153,138,1,1)', 
        'rgba(13,108,175,1)',
        'rgba(153,102,255,1)',
        'rgba(255,159,64,1)',
    ]

    const sortColumn = ( clickedColumn, sortingType, list) => {

		const compare = ( a, b ) => {
            let ret;
            if (typeof a[clickedColumn] === 'number' ) {

                ret =  a[clickedColumn] -  b[clickedColumn]
            
            } else if (a[clickedColumn] instanceof Date) {

                ret = Date.parse(a[clickedColumn]) - Date.parse(b[clickedColumn]);

            } else {

                ret =  a[clickedColumn].toUpperCase().localeCompare( b[clickedColumn].toUpperCase() );

            }
			return sortingType === "asc" ? ret : ( -ret );
		}
		return list.sort( compare );
    
	}

    // seachField used to track search field. SeachValue used for re-rendering. Loading at most once every half sec.
    let searchField = useRef('');
    let refreshSearch = useRef(true);
    const [searchValue, setSearchValue] = useState('');

    const modifySearchParam = ( value) => {    
        searchField.current = value;
        if (refreshSearch.current){
            refreshSearch.current = false;
            setTimeout(()=> {
                refreshSearch.current = true;
                setSearchValue(searchField.current);
            }, 500);
        }
    }

    // used to calculate summary table information
    const calculateSummaryData = (computers) => {
        let summarizeDataObj = {}

        const filterString = JSON.stringify(filterObj);

        const filteredCompList = computerList.filter(c => (rowIncludesSearch(c) && (filterString === '{}' || rowMatchesFilter(c, filterObj.propName, filterObj.propValue))))

        filteredCompList.forEach(c => {

            if (Array.isArray(c[selectedChart])){
                c[selectedChart].forEach(item => {
                    summarizeDataObj[item] = 1 + (summarizeDataObj[item] || 0)
                });
            }
            else {
                summarizeDataObj[c[selectedChart]] = 1 + (summarizeDataObj[c[selectedChart]] || 0)
            }
        });

        let summaryArray = Object.entries(summarizeDataObj);

        summaryArray.sort((a, b) => {
            return b[1] - a[1];
          });
        
        // used to calculate 'other' field if there are too many results -- i.e. more than 6
        let summaryArrayCollapsed =  summaryArray.slice(0, 6);

        if (summaryArray.length > 6){

            const otherCount = summaryArray.slice(5,summaryArray.length).reduce((result, item) => {
                result = result + item[1];
                return result
            }, 0 )
            summaryArrayCollapsed.splice(5, 1, ['other', otherCount]);
        }
        
        const totalItems = summaryArrayCollapsed.reduce((result, item) => {
            result = result + item[1];
            return result
        }, 0 );

        return summaryArrayCollapsed.map((data, i) => ({id: i, field: data[0], count: data[1], percentage: (totalItems === 0? 0 : (Math.round( data[1] * 10000 / totalItems) / 100 )) + '%'  }));
        

    }
   
    const headersBottom = [
        {field: 'name', label: 'Name', style: {textAlign: 'center'}, sortable: true, renderHtml: (model) => {return (drawName(model))}},
        {field: 'scanVersion', label: propNames.scanVersion, style: {textAlign: 'center'}, sortable: true},
        {field: 'lastScanTime', label: propNames.lastScanTime, style: {textAlign: 'left'}, sortable: true},
        {field: 'vulnFileCount', label: propNames.vulnFileCount, style: {textAlign: 'center'}, sortable: true},
        {field: 'potVulnFileCount', label: propNames.potVulnFileCount, style: {textAlign: 'center'}, sortable: true},
        {field: 'mitigatedFileCount', label: propNames.mitigatedFileCount, style: {textAlign: 'center'}, sortable: true},
        {field: 'versionsFound', label: propNames.versionsFound, style: {textAlign: 'center'}, sortable: true, renderHtml: (model) => {return (drawVersionsFound(model))}},
        {field: 'scanDuration', label: propNames.scanDuration, style: {textAlign: 'center'}, sortable: true},
        {field: 'fileResultDetails', label: propNames.fileResultDetails, style: {textAlign: 'center'}, sortable: true, renderHtml: (model) => {return (drawFileResultDetails(model))}},
    ];

    const drawName = (model) => {
        return(
            <a href={"/webreports?page=SingleComputerReport&ComputerName=" + model.datasourceName + "/" + model.computerid} target="_blank">{model.name}
            </a>
        )
    }

    const drawFileResultDetails = (model) => {
        return(
            <div>
               { model.fileResultDetails.slice(0,3).map(file => <li>{file}</li>)}
               {
                   model.fileResultDetails.length > 3 && 
                   expandedRows.includes(model.computerid) && 
                   model.fileResultDetails.slice(3,model.fileResultDetails.length).map(file => <li>{file}</li>)
               }
               {
                   model.fileResultDetails.length > 3 && 
                    
                    <Button
                        className='button'
                        type='secondary-ghost'
                        style={{float:'right', height:'10px'}}
                        onClick={() => modifyRowExpansion(model.computerid)}
                    >
                        {expandedRows.includes(model.computerid)? '[ - ]' : '[ + ]'}
                    </Button>
               }
            </div>
            
        )
    }

    const drawVersionsFound = (model) => {

        const versionCounts =   {}
        model.versionsFound.forEach(v => {
            versionCounts[v] = 1 + (versionCounts[v] || 0)
        });

        let versionsArray = Object.entries(versionCounts)
        versionsArray.sort((a, b) => {
            return b[1] - a[1];
          });

        return(
      
            <div>
                { versionsArray.slice(0,3).map(item => <li>{item[0] +  (['n/a', '<none>'].includes(model.versionsFound[0])? '': ' (x' + item[1] + ')')}</li>)}
                {
                    versionsArray.length > 3 && 
                    expandedRows.includes(model.computerid) && 
                    versionsArray.slice(3, versionsArray.length).map(item => <li>{item[0] + ' (' + item[1] + ')'}</li>)
                }
                {
                    versionsArray.length > 3 && 
                     
                     <Button
                         className='button'
                         type='secondary-ghost'
                         style={{float:'right', height:'10px'}}
                         onClick={() => modifyRowExpansion(model.computerid)}
                     >
                         {expandedRows.includes(model.computerid)? '[ - ]' : '[ + ]'}
                     </Button>
                }
             </div>
        )
    }

    const columnsWithLabel = headersBottom.reduce((result, h) => {
        if (h.label && h.field){
            result.push(h)
        }
        return result
    }, []);

    const rowMatchesFilter = (row, propName, propValue)=> {

        if(propName === 'versionsFound'){
            return row.versionsFound.includes(propValue)
        }
        else{
            return row[propName] === propValue
        }
    }

    const rowIncludesSearch = (row) => {
        const searchLower = searchValue.toLowerCase();
        return (
            columnsWithLabel.some(c => ( row[c.field] && String(row[c.field]).toLowerCase().includes(searchLower)))
        )
    }

    const filterString = JSON.stringify(filterObj);

    const rowsBottom = computerList.filter(r => (rowIncludesSearch(r) && (filterString === '{}' || rowMatchesFilter (r, filterObj.propName, filterObj.propValue)) ));

    //export to csv function

    const downloadCSV = () => {
        let csvContent = columnsWithLabel.map(c => c.label).join(',') + '\n';
        csvContent += rowsBottom.map(r => columnsWithLabel.map(c => String(r[c.field]).includes(',')? '"' + String(r[c.field]) + '"' : String(r[c.field]) ).join(',')).join('\n');
    
        csvContent = 'data:text/csv;charset=utf-8,' + csvContent;
        const encodedUri = encodeURI(csvContent);
        window.open(encodedUri);   
      }
    
    const summaryHeaders = [
        {field: 'color', renderHtml: (model) => {return (drawLegendColor(model))}}, 
        {field: 'field', label: charts[selectedChart] , style: {textAlign: 'center'}},
        {field: 'count', label: (selectedChart === 'versionsFound'? 'Instance Count': 'Computer Count'), style: {textAlign: 'center'}, renderHtml: (model) => {return (drawCounts(model))}},
        {field: 'percentage', label: 'Percentage', style: {textAlign: 'center'}},
    ];

    // summary rows are calculated for first 5 items and summarized for the rest 
    const summaryRows = calculateSummaryData(computerList)

    const drawLegendColor = (model) => {
        return(
            <div style= {{height:'20px', width:'20px', margin: '2px', border:'1px solid', backgroundColor: backgroundColor[model.id], borderColor: borderColor[model.id] }}>
            </div>
        )
    }

    const drawCounts = (model) => {
        return(
            <>
                {
                    model.field !== 'other'? 
                    <Button
                        style={{ height:'0.7rem', width:'20px', padding:'0', textAlign:'center', border:' 0px'}}
                        type='ghost'
                        onClick={() => { setFilterObj({propName: selectedChart, propValue: model.field}) }}
                    >
                        {model.count}
                    </Button>
                    :
                    <div style={{ height:'0.7rem', width:'20px', padding:'0', textAlign:'center'}}>{model.count}</div>
                }
            </>
                
            
            
        )
    }

    return (
        <div>
            <div style={{ width: '100%'}}>
                <div style={{ width: '50%', float:'left', padding: '100px 50px'}}>
                    <div style={{ width:'100%', fontSize:'x-large'}}>
                        <table style={{ borderSpacing: '0.1rem 0.1rem', borderCollapse: 'separate'}}>
                            <tbody>
                                <tr>
                                    <td 
                                        style={{verticalAlign:'middle', width:'20%', textAlign:'right',  paddingRight:'20px'}}
                                    > 
                                        Charts:
                                    </td>  
                                    <td style={{verticalAlign:'middle' , width:'80%'}}>

                                        <Dropdown
                                            type='bottom'
                                            label='Charts'
                                            items={Object.keys(charts).map(c => ({id:c, text: charts[c]}))}
                                            selectedItem={selectedChart}
                                            onChange={(item) =>  {setSelectedChart(item.id)}}
                                        />

                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                <div style={{paddingTop:'10px'}}>
                    <DataTable                
                        id='main-summary'
                        type='compact'
                        tableConfig={summaryHeaders}
                        tableData={summaryRows}
                    />
                </div>
                </div>

                <div style={{ width: '45%', float:'right', padding: '50px 100px'}}>
                    <PropDoughnutChart
                        dataset = {summaryRows}
                        backgroundColor={backgroundColor}
                        borderColor={borderColor}
                        hoverBorderColor={hoverBorderColor}
                        hoverBackgroundColor={hoverBackgroundColor}
                    />
                </div>
            </div>    
            <div
                style={{padding:'0px 30px', width:'100%', minHeight:'10px', display:'inline-block'}}
            >

                <div style={{ width:'900px', display: 'inline-block', paddingLeft:'20px',  float: 'left'}}>

                    <table style={{border:'none'}}>
                        <tbody>
                            <tr>
                                <td style={{padding:'0px', verticalAlign:'middle'}}>
                                    <ExportIcon onClick={() => {downloadCSV()}} /> 
                                </td>
                                {
                                    JSON.stringify(filterObj) !== '{}' &&
                                    <>
                                        <td style={{padding:'0px 5px', verticalAlign:'middle'}}>
                                            <Button
                                                className='button'
                                                type='secondary-danger'
                                                onClick={() => setFilterObj({})}
                                            >
                                                {'Clear Filter'}
                                            </Button>
                                        </td>
                                        <td style={{fontSize:'medium', fontStyle:'italic', paddingLeft: '5px', verticalAlign:'middle'}}>
                                            {'Only showing computers where ' +  charts[filterObj.propName] + (filterObj.propName === 'versionsFound'? ' contains ': ' equals ') + filterObj.propValue }
                                        </td> 
                                    </>

                                }
                            
                            </tr>
                        </tbody>
                    </table>
                </div>
    

                <div style={{ float:'right', width: '250px', display:'block', paddingTop:'0px', paddingRight:'20px'}}>
                    <TextInput
                        id='searchInput'
                        onChange={(e)=> {modifySearchParam(e.target.value)}}
                        placeholder='Search...'
                        value={searchValue}
                    />
                </div>

                <div style={{width:'100%' ,padding:'10px 20px', display:'inline-block'}}>
                    <Pagination
                        currentPage={page + 1}
                        itemsPerPageText='Computers per Page:'
                        
                        itemsPerPageToSelect={rowsPerPage}
                        itemsPerPageStepper = {10}
                        itemsStepperLimit = {100}
                        onItemsPerPageChange={(itemPerPage, currentPageNo) => {setRowsPerPage(itemPerPage); setPage(0)}}
                        onPageChange={(currentPageNo) => { setPage(currentPageNo-1); }}
                        itemsPerPageInfoText= 'computers'
                        position={{
                            left: [
                            'itemsPerPageSelection',
                            'itemsPerPageInfo',
                            'pageNumberSelection'
                            ],
                            right: [
                            'pageNumberInfo'
                            ]
                        }}
                        totalItems={rowsBottom.length}
                    />


                    <div style={{overflow:'auto', width:'100%'}}> 
                        <DataTable
                            onSort={(column, order) => {
                                setComputerList( sortColumn( column, order, [...computerList]));
                                } 
                            }
                            id='detailsTable'
                            tableConfig={headersBottom}
                            tableData={rowsBottom.slice(page*rowsPerPage, (page*rowsPerPage)+rowsPerPage) }


                        />
                    </div>
                </div>

            </div>
        
        </div>

    )
}