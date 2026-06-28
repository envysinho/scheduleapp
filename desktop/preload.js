const { contextBridge } = require('electron');

// Expone solo lo necesario de manera segura
contextBridge.exposeInMainWorld('api', {
  // Aquí puedes agregar métodos seguros si los necesitas en el futuro
});
