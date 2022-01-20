import React, { useState, useEffect, useContext, useMemo} from 'react';

import {AppContext} from './dashboard/appContext';
import { MainPage as MainReport} from './dashboard/MainPage'; 
import {fakeComputers} from './dashboard/fakeDataSet';

import { Notification } from './dashboard/Notification';


import {Layout} from '@bigfix-ui/core';
import {RefreshIcon, DarkmodeToggleIcon} from '@bigfix-ui/core';

import {useThemeState, useThemeCreator, ThemeProvider, Loading, usePlatform} from '@bigfix-ui/core';

import {Title, LastUpdated} from '@bigfix-ui/core';

import { format } from 'date-fns';

import './App.css';

const App = () =>  {

  const platform = usePlatform();

  const [ themeState, setThemeState ] = useThemeState();
  const theme = useThemeCreator({
    type: themeState,
    values: {
        'header-color': themeState === 'dark' ? '#262626' : '#FFF',
        'header-font-color': themeState === 'dark' ? '#DEDEDE' : '#363636',
        'tile-background': themeState === 'dark' ? '#393939' : '#EEEEEE',
        'currentColor': themeState === 'dark' ?'#262626' : '#FFF',
        'calendarColor': themeState === 'light'? 'CaledarLight' : 'CaledarDark',
        'row-Background': themeState === 'light'? 'selectedLight' : 'selectedDark',
        'chart-background-opacity': themeState === 'light' ? '0.3' : '0.5',
        'chart-hover-opacity': themeState === 'light' ? '0.4' : '0.9',
        'notification-border': themeState === 'light' ? '#c10c0d' : '#eb0909',
        'notification-background': themeState === 'light' ? '#fff2f2' : '#730c0c',
    }
  });

  const [ appContext, setAppContext ] = useState({
    lastUpdate: new Date().getTime(),
    loading: true,
    analysisActivated: false,
  });

  const appContextValue = useMemo(() => ({ appContext, setAppContext }), [ appContext, setAppContext ]);

  const [computerData, setComputerData]= useState([]);
 
  // useEffect to load data 
  useEffect (() => {

    if (appContext.loading) {

      let analysisActivated;

      const configRelevance = `
      exists bes fixlet whose 
        (
          analysis flag of it 
          AND  active flag of best activation of it 
          AND mime field "x-fixlet-win11-eligibility" of it = "analysis" 
        )
      `;

      if (platform === 'browser')
      {
        analysisActivated = 'False';
      }
      else 
      {
        analysisActivated = window.EvaluateRelevance(configRelevance);
      }

 
    const relevance = ` 
    (
      concatenation "||" of 
      (
        id of item 10 of it as string;
        name of item 10 of it | "n/a";
        value of (result (item 0 of it, item 10 of it )) | "n/a";
        value of (result (item 1 of it, item 10 of it )) | "n/a";
        value of (result (item 2 of it, item 10 of it )) | "n/a";
        value of (result (item 3 of it, item 10 of it )) | "n/a";
        value of (result (item 4 of it, item 10 of it )) | "n/a";
        value of (result (item 5 of it, item 10 of it )) | "n/a";
        value of (result (item 6 of it, item 10 of it )) | "n/a";
        value of (result (item 7 of it, item 10 of it )) | "n/a";
        value of (result (item 8 of it, item 10 of it )) | "n/a";
        value of (result (item 9 of it, item 10 of it )) | "n/a";
        (
          concatenation "-" of 
          (
            year of it as string; 
            last 2 of ("0" & it) of (month of it as integer as string); 
            last 2 of ("0" & it) of (day_of_month of it as string) 
          ) of date (local time zone) of it 
          & " "  
          & (it as string) of time of time (local time zone) of it 
        )
        of last report time of item 10 of it | "";
        database name of item 10 of it| ""
      )
    )
    of 
    (
      property 1 of item 0 of it,
      property 2 of item 0 of it,
      property 3 of item 0 of it,
      property 4 of item 0 of it,
      property 5 of item 0 of it,
      property 6 of item 0 of it,
      property 7 of item 0 of it,
      property 8 of item 0 of it,
      property 9 of item 0 of it,
      property 10 of item 0 of it,
      elements of item 1 of it
    )
    of 
    (
      bes fixlet whose 
        (
          analysis flag of it 
          AND mime field "x-fixlet-win11-eligibility" of it = "analysis" 
        )
      ,set of bes computers whose 
        (
          operating system of it as lowercase starts with "win10"
        )
    )
  `;

  

    let tempComputers =  [];

    if (platform === 'browser')
    {
      tempComputers = fakeComputers;
    }
    else 
    {
      tempComputers = window.EvaluateRelevance(relevance);
    }

    const computers = tempComputers.map(c => {
      const compArr = c.split('||');
      return ({
        computerid: compArr[0],
        name: compArr[1],
        vulFileList: compArr[2].split('**'),
        scanVersion: compArr[3].includes('Scanner ')? compArr[3].split('Scanner ')[1].split(' ')[0]: 'n/a',
        lastScanTime: compArr[4],
        vulnFileCount: compArr[5],
        potVulnFileCount: compArr[6],
        mitigatedFileCount: compArr[7],
        fileResultDetails: compArr[8].split('**'),
        fileScanCount: compArr[9],
        scanDuration: compArr[10],
        versionsFound: compArr[11].split('**'),
        numLogpressoMitigationFiles: compArr[12],
        logpressoMitigationRollbackFiles: compArr[13].split('**'),
      })
    });


    setComputerData(computers);
    setAppContext(c => ({...c, loading:false, analysisActivated: analysisActivated.toLowerCase()}))
  }

}, [appContext.loading])


return (
  <AppContext.Provider value={appContextValue}>
    <ThemeProvider theme={theme}>
    <div className="App">
      <Layout
        icons={
          [
            <DarkmodeToggleIcon 
              toggle={ themeState === 'light' ? 0 : 1 }
              onClick={()=>{ setThemeState( themeState === 'light' ? 'dark' : 'light' ) }}
              />,
            <RefreshIcon onClick={() => {setAppContext(c => ({...c, loading:true, lastUpdate: new Date().getTime()})) }}/>
          ]
        }>
          {
            appContext.analysisActivated === 'false' && 
            <Notification />

          }
          <LastUpdated timestamp={format(appContext.lastUpdate, 'yyyy-MM-dd hh:mm:ss aa')}/>  

            <Title> Log4j Vulnerability Report (Logpresso Scan)</Title> 

            {
              appContext.loading?
              <Loading />            
              :
              <MainReport computerData={computerData}/>
            }
         
        </Layout>
      </div>
    </ThemeProvider>
  </AppContext.Provider>
);
}

export default App;
