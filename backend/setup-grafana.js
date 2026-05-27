const url = 'http://localhost:52714/api/datasources';
const auth = 'Basic ' + Buffer.from('admin:admin').toString('base64');
const ds = {
  name: 'PostgreSQL',
  type: 'postgres',
  url: 'ep-little-dream-apv718f4-pooler.c-7.us-east-1.aws.neon.tech:5432',
  database: 'neondb',
  user: 'neondb_owner',
  secureJsonData: { password: 'npg_nYpSgDxQ37Uk' },
  jsonData: { sslmode: 'require', postgresVersion: 15 },
  access: 'proxy',
  isDefault: true
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': auth },
  body: JSON.stringify(ds)
}).then(r => r.json()).then(data => {
  console.log('Datasource created:', data);
  
  // Now create the dashboard
  const dashboard = {
    dashboard: {
      id: null,
      uid: "nutika_main",
      title: "Nutika Elektrivõrgu Juhtimiskeskus",
      tags: [ "templated" ],
      timezone: "browser",
      panels: [
        {
          type: "timeseries",
          title: "Elektrihinnad (Historical Price)",
          gridPos: { h: 9, w: 12, x: 0, y: 0 },
          datasource: { type: "postgres", uid: "PostgreSQL" },
          targets: [{
            datasource: { type: "postgres", uid: "PostgreSQL" },
            format: "time_series",
            rawQuery: true,
            rawSql: "SELECT \"timestamp\" AS \"time\", price AS \"Elektrihind (€/MWh)\" FROM \"HistoricalPrice\" ORDER BY \"timestamp\" ASC"
          }]
        },
        {
          type: "stat",
          title: "Seadmete staatus (Device Status)",
          gridPos: { h: 9, w: 12, x: 12, y: 0 },
          datasource: { type: "postgres", uid: "PostgreSQL" },
          targets: [{
            datasource: { type: "postgres", uid: "PostgreSQL" },
            format: "table",
            rawQuery: true,
            rawSql: "SELECT name AS \"Seade\", CASE WHEN status THEN 'Sees (ON)' ELSE 'Väljas (OFF)' END AS \"Staatus\" FROM \"Device\""
          }],
          options: {
            reduceOptions: { values: true, fields: "" },
            textMode: "auto"
          }
        },
        {
          type: "timeseries",
          title: "Ajalooline andmestik (Seadmete logid)",
          gridPos: { h: 9, w: 24, x: 0, y: 9 },
          datasource: { type: "postgres", uid: "PostgreSQL" },
          targets: [{
            datasource: { type: "postgres", uid: "PostgreSQL" },
            format: "time_series",
            rawQuery: true,
            rawSql: "SELECT \"timestamp\" AS \"time\", CASE WHEN command = 'ON' THEN 1 ELSE 0 END AS \"Staatus\", \"deviceId\" FROM \"DeviceLog\" ORDER BY \"timestamp\" ASC"
          }]
        }
      ],
      schemaVersion: 38,
      version: 1
    },
    folderId: 0,
    overwrite: true
  };

  return fetch('http://localhost:52714/api/dashboards/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify(dashboard)
  });
}).then(r => r.json()).then(d => console.log('Dashboard created:', d)).catch(console.error);
