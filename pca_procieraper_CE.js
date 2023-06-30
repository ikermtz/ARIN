/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    | J.Lejarza  |  07/10/21  | ARIN - Procesos de cierre y de apertura.                    |
	 |---------+------------+------------+-------------------------------------------------------------+
     |   Eventos de cliente para el suitelet pca_procieraper_SL para la ventana de búsqueda.           |    
     +---------+------------+------------+-------------------------------------------------------------+
     |  1.1    | J.Lejarza  |  22/03/22  | ARIN - Procesos de cierre y de apertura.                    |
	 |---------+------------+------------+-------------------------------------------------------------+
     |  1.2    | I.Martinez |  04/04/23  | ARIN - Procesos de cierre y de apertura - MultiOrg.         |             
     +-------------------------------------------------------------------------------------------------+
     |   Subsidiarias habilitadas.                                                                     |     
     +---------+------------+------------+-------------------------------------------------------------+
*/

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

 define(['N/currentRecord', 'N/url', 'N/format'],
    function(n_currecord, n_url, n_format) 
    {
        function pageInit(context)
        {
            return true;
        }
        
        function saveRecord(context)
        {
            return true;
        }
        
        function validateField(context)
        {
            return true;
        }
        
        function fieldChanged(context)
        {    
            return true;
        }
        
        function postSourcing(context)
        {
            return true;
        }
        
        function lineInit(context)
        {
            return true;
        }
        
        function validateLine(context)
        {
            return true;
        }
        
        function validateInsert(context)
        {
            return true;
        }
        
        function validateDelete(context)
        {
            return true;
        }
        function sublistChanged(context)
        {
            return true;
        }

        function buscarInformacionContable()
        {
            if(!n_currecord.get().getValue('fechaasiento') || !n_currecord.get().getValue('tipoproceso') || !n_currecord.get().getValue('subsidiaria'))
            {
                alert('Es obligatorio indicar la subsidiaria, el tipo de proceso y la fecha del asiento.');
            }
            else
            {
                //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
                window.onbeforeunload = null;

                //Obtener la dirección del script
                var url = window.location.origin + n_url.resolveScript({scriptId: 'customscript_arin_pca_procieraper_sl', deploymentId: 'customdeploy_arin_pca_procieraper_sl'});

                //Indicar que hay que buscar los apuntes contables
                url += '&buscar=Y';
                //El parámetro fecha hay que convertirlo para poderlo pasar
                var dateStr = n_format.format({value: new Date(n_currecord.get().getValue('fechaasiento')), type: n_format.Type.DATE});                
                url += '&fechaAsiento=' + dateStr;
                //Parámetro tipo de proceso
                url += '&tipoProceso=' + n_currecord.get().getValue('tipoproceso');
                //Parámetro Subsidiaria
                url += '&subsidiaria=' + n_currecord.get().getValue('subsidiaria');
                //Recargar la pantalla
                window.open(url, '_self'); 
            }
        }

        function habilitarNuevaBusqueda()
        {
            //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
            window.onbeforeunload = null;

            //Obtener la dirección del script
            var url = window.location.origin + n_url.resolveScript({scriptId: 'customscript_arin_pca_procieraper_sl', deploymentId: 'customdeploy_arin_pca_procieraper_sl'});
            //El parámetro fecha hay que convertirlo para poderlo pasar
            var dateStr = n_format.format({value: new Date(n_currecord.get().getValue('fechaasiento')), type: n_format.Type.DATE});                
            url += '&fechaAsiento=' + dateStr;
            //Parámetro tipo de proceso
            url += '&tipoProceso=' + n_currecord.get().getValue('tipoproceso');
            //Parámetro Subsidiaria
            url += '&subsidiaria=' + n_currecord.get().getValue('subsidiaria');
            //Recargar la pantalla
            window.open(url, '_self'); 
        }
        
        return{
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            lineInit: lineInit,
            validateLine: validateLine,
            validateInsert: validateInsert,
            validateDelete: validateDelete,
            sublistChanged: sublistChanged,
            buscarInformacionContable: buscarInformacionContable,
            habilitarNuevaBusqueda: habilitarNuevaBusqueda
        };
    }
);