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
      exists fixlets whose
        (
          analysis flag of it 
          AND name of it = "log4j2-scan results" 
          AND active flag of best activation of it 
        )
      of bes site whose (id of it = 3093)
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
      concatenation "||" of tuple string items of it) of (it as string) of
      (
        (
          id of item 0 of it
          ,name of item 0 of it | "No Name"
          , database name of item 0 of it| ""
          , (if exists (values of results(item 0 of it, item 0 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 0 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 1 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 1 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 2 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 2 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 3 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 3 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 4 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 4 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 5 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 5 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 6 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 6 of item 1 of it) else "<none>") of it
          , (if exists (values of results(item 0 of it, item 7 of item 1 of it)) then concatenation "**" of values of results (item 0 of it, item 7 of item 1 of it) else "<none>") of it
        ) 
        of (elements of item 0 of it, item 1 of it) of it
      ) 
      of
      (
        set of applicable computers of it, 
        (
          /* Properties from the Analysis.  Note property id "7" has to be skipped because that property was removed at some point from the analysis, leaving a gap */
          property 2 of it
          , property 3 of it
          , property 4 of it
          , property 5 of it
          , property 6 of it
          , property 8 of it
          , property 10 of it
          , property 11 of it
        )
      ) 
      of fixlets whose (analysis flag of it and name of it = "log4j2-scan results") of bes site whose (id of it = 3093)
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
        datasourceName: compArr[2],
        scanVersion: compArr[3].includes('Scanner ')? compArr[3].split('Scanner ')[1].split(' ')[0]: 'n/a',
        lastScanTime: compArr[4],
        vulnFileCount: compArr[5],
        potVulnFileCount: compArr[6],
        mitigatedFileCount: compArr[7],
        fileResultDetails: compArr[8] === ''? ['n/a']: compArr[8].split('**'),
        scanDuration: compArr[9],
        versionsFound: compArr[10] === ''? ['n/a']: compArr[10].split('**'),
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
