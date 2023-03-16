/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Iker       |  XX/03/23  | Pantalla para movimientos manuales                                  |
     |---------+------------+------------+---------------------------------------------------------------------+
  
*/

/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

 define(['N/url', 'N/currentRecord','N/record', 'N/format'],
    function(n_url, n_currecord, n_record, n_format)  {

        function pageInit(context){
            return true;
        }
        
        function saveRecord(){ 

            var submitField = n_currecord.get().getValue({fieldId: 'custpage_submitfield'});

            // Intenta gastar sin tener suficiente dinero
            if ( (submitField == 'Guardar Movimiento') && (!puedeComprar()) ){     

                alert('El saldo actual no es suficiente para realizar ese movimiento.');
                return false;
            }
            return true;
        }

        function validateField(context){
            return true;
        }
        
        function fieldChanged(context){    
            return true;        
        }
        
        function postSourcing(context){
            return true;
        }
        
        function lineInit(context){
            return true;
        }
        
        function validateLine(context){
            return true;
        }
        
        function validateInsert(context){
            return true;
        }
        
        function validateDelete(context){
            return true;
        }

        function sublistChanged(context){
            return true;
        }

        function consultarMovimientos(){

            //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
            window.onbeforeunload = null;
          
            //Obtener la dirección del script
            var url = window.location.origin + n_url.resolveScript({scriptId: 'customscript_ai_movpantallas_ss', deploymentId: 'customdeploy1'});
          
            //Indicar que hay que se ha hecho la busqueda
            url += '&buscar=Y';

            url += '&usuario=' + n_currecord.get().getValue('custpage_usuario');
          
            var ini = n_currecord.get().getValue('custpage_fechainicio');
            var fin = n_currecord.get().getValue('custpage_fechafin');

            // Si ini no tiene valor no filtramos
            if(!!ini){
                var dateStrIni = n_format.format({value: new Date(n_currecord.get().getValue('custpage_fechainicio')), type: n_format.Type.DATE});          
                url += '&fechainicio=' + dateStrIni;
            
            // Si ini tiene valor filtramos
            } else {
                url += '&fechainicio=';
            }

             // Si fin no tiene valor no filtramos
             if(!!fin){
                var dateStrFin = n_format.format({value: new Date(n_currecord.get().getValue('custpage_fechafin')), type: n_format.Type.DATE});          
                url += '&fechafin=' + dateStrFin;
            
            // Si fin tiene valor filtramos
            } else {
                url += '&fechafin=';
            }
                           
            //Recargar la pantalla
            window.open(url, '_self');  
        }

        function cancelar(context){

            //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
            window.onbeforeunload = null;

            if (!confirm('Se perderán los datos introducidos. ¿Quiere volver a la pantalla anterior?')) return;
         
            var url = window.location.origin +  n_url.resolveScript({scriptId: 'customscript_ai_movpantallas_ss', deploymentId: 'customdeploy1'});
            
            //Recargar la pantalla
            window.open(url, '_self');    
        }

        function puedeComprar(){

            var id = n_currecord.get().getValue({
                fieldId: 'custpage_usuario'
            });

            // Recupero los otros campos necesarios
            var importe = n_currecord.get().getValue({
                fieldId: 'custpage_importe'
            });
            var mov = n_currecord.get().getValue({ 
                fieldId: 'custpage_mov'
            });

            // Cargamos el usuario
            var usuario = n_record.load({
                type: 'customrecord_ai_tb_registroej1',
                id: id,
                isDynamic: true
            });
            
            // Obtenemos el saldo
            var saldo = usuario.getValue({
                fieldId: 'custrecord_ai_registroej1_saldo'
            });

            var tieneSaldo = true;
            var dinero = saldo - importe;
             
            // Puede gastar
            if ((mov==2) && ( dinero < 0) ){ 
                tieneSaldo = false;                
            } 
            return tieneSaldo;
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
            consultarMovimientos: consultarMovimientos,
            cancelar:cancelar
        };
    }
);