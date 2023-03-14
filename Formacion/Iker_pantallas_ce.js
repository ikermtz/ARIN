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

 define(['N/log', 'N/url', 'N/currentRecord','N/record', 'N/format'],
    function(n_log, n_url, n_currecord, n_record, n_format)  {
        
        function puedeComprar(){

            n_log.debug({title: 'Entra en puede comprar'});

            var curRecord = n_currecord.get();

            var id = curRecord.getValue({
                fieldId: 'custpage_usuario'
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

            // Recupero los otros campos necesarios
            var importe = curRecord.getValue({
                fieldId: 'custpage_importe'
            });
            var mov = curRecord.getValue({ 
                fieldId: 'custpage_mov'
            });

            var tieneSaldo;
             
            // Puede gastar
            if ((mov==2) && (saldo-importe < 0) ){ 
                tieneSaldo = false;                
            } else {
                tieneSaldo = true;
            }

            n_log.debug({title: 'Tiene saldo?' + tieneSaldo})

            return tieneSaldo;
        }

        function pageInit(context){
            return true;
        }

        function movimiento(context){ 
            
            n_log.debug({title: 'Entra en movimiento'});

            var submitField = n_currecord.get().getValue({fieldId: 'custpage_submit_field' });

            if ( (submitField == 'Guardar Movimiento') && (!puedeComprar()) ){

                n_log.debug({title: 'Quiere comprar pero no puede'});               
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

            n_log.debug({title: 'Entra en consultar movimientos'});

            //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
            window.onbeforeunload = null;

            n_log.debug({title: 'A'});
          
            //Obtener la dirección del script
            var url = window.location.origin + n_url.resolveScript({scriptId: 'customscript_ai_pantallas_ss', deploymentId: 'customdeploy_ai_pantallas_ss'});
           
            n_log.debug({title: 'B'});
          
            //Indicar que hay que se ha hecho la busqueda
            url += '&buscar=Y';

            url += '&usuario=' + n_currecord.get().getValue('custpage_usuario');
            
            n_log.debug({title: 'C'});
          
            var fini = n_currecord.get().getValue('custpage_fechainicio');
            var ffin = n_currecord.get().getValue('custpage_fechafin');

            // Si esta vacio lo ponemos y sino lo concatenamos
            if (!!fini) {
                var dateStrIni = n_format.format({value: new Date(fini), type: n_format.Type.DATE});                
                url += '&fechainicio=' + dateStrIni;                
            } else {
                url += '&fechainicio=' ;
            }
          
          	n_log.debug({title: 'D'});

            // Si esta vacio lo ponemos y sino lo concatenamos
            if (!!ffin) { 
                var dateStrFin = n_format.format({value: new Date(ffin), type: n_format.Type.DATE});                
                url += '&fechafin=' + dateStrFin;                
            } else { 
                url += '&fechafin=' ;
            }             

            //Recargar la pantalla
            window.open(url, '_self');  
            
            n_log.debug({title: 'Movimientos consultados'});

        }

        function cancelar(context){
            
            n_log.debug({title: 'Entra en cancelar'});

            //Para evitar que aparezca el aviso por defecto del navegador de cambios pendientes
            window.onbeforeunload = null;

            if (!confirm('Se perderán los datos introducidos. ¿Quiere volver a la pantalla anterior?')) return;
         
            var url = window.location.origin +  n_url.resolveScript({scriptId: 'customscript_ai_pantallas_ss', deploymentId: 'customdeploy_ai_pantallas_ss'});
            
            //Recargar la pantalla
            window.open(url, '_self');    
            
            n_log.debug({title: 'Se cancela el movimiento'});
        }
        
        return{
            pageInit: pageInit,
            movimiento: movimiento,
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