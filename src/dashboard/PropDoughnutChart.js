import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';


ChartJS.register(ArcElement, Tooltip, Legend);

export const PropDoughnutChart = ({dataset, backgroundColor, borderColor,hoverBackgroundColor, hoverBorderColor}) => {

    const data = {
        labels: dataset.map(d => d.field),
        datasets: [
          {
            label: '# of Votes',
            data:dataset.map(d => d.count),
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            hoverBackgroundColor: hoverBackgroundColor,
            hoverBorderColor: hoverBorderColor,
            borderWidth: 1,
          },
        ],
      };

    return <Doughnut data={data} />;

}