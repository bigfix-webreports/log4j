import React from 'react';

import { useTheme } from '@bigfix-ui/core';



export const Notification = ({title, message}) => {

    const [theme]  = useTheme();

    return (
        <div style={{ width: '100%',  padding: '0px 20px', margin: '0.1rem 0', display:'inline-block'}}>

            <div style= {{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: theme['notification-border'], borderLeftWidth: '0.325rem', borderRadius:'5px' ,backgroundColor: theme['notification-background']}}>

                <div style={{ margin: '1rem 1rem', display:'flex'}}>
                    <svg 
                        focusable="false" 
                        preserveAspectRatio="xMidYMid meet" 
                        xmlns="https://www.w3.org/2000/svg" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 20 20" 
                        aria-hidden="true" 
                        className="hcl-notification-icon" 
                        style={{willChange: 'transform', fill: 'rgb(224, 24, 45)'}}
                    >
                        <path d="M10 1c-5 0-9 4-9 9s4 9 9 9 9-4 9-9-4-9-9-9zm3.5 13.5l-8-8 1-1 8 8-1 1z"></path>
                        <path d="M13.5 14.5l-8-8 1-1 8 8-1 1z" data-icon-path="inner-path" opacity="0"></path>
                    </svg>

                </div>
                

                <div style={{ margin: '1rem 0', textAlign:'left', width: 'calc(100% - 4.5rem)'}}>
                    <span style={{ fontWeight:'bold', paddingRight: '0.5rem'}} >
                        Important note:
                    </span>
                    {'Please activate the following analysis for up to date information:  '}
                    <a 
                        href='<?relevance link href of bes fixlets whose (analysis flag of it AND mime field "x-fixlet-win11-eligibility" of it = "analysis" ) ?>' 
                        // style={{fontSize: 'x-large'}}
                    >
                        Log4J Analysis
                    </a> 
                </div> 

            </div>
            
        
        </div>
    )


}