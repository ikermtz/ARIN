/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    |  Iker      |  XX/XX/XX  | Meter los datos en json_mov                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */

 define(['N/log', 'N/currentRecord','N/record', 'N/format'],
    function(n_log, n_currecord, n_record, n_format){
        
        function pageInit(context){
            return true;
        }
        
        // Segun se guarde un movimiento, obtener los datos y meterlos en el campo json_mov
        function saveRecord(context){

            n_log.debug({title: 'Entra al saveRecord'});
            
            // Cargamos el registro de MOVIMIENTO recien guardado
            var movimiento = n_currecord.get();

            // Extraemos los datos
            var mov = movimiento.getValue({fieldId: 'custrecord_ai_movimientosej1_mov'});
            var concepto = movimiento.getValue({fieldId: 'custrecord_ai_movimientosej1_concepto'});
            var importe = movimiento.getValue({fieldId: 'custrecord_ai_movimientosej1_importe'});
            var fechaAux = new Date();
            var fecha = n_format.format({value: fechaAux, type: n_format.Type.DATE}); 
            var usuario = movimiento.getValue({fieldId: 'custrecord_ai_movimientosej1_usuario'});

            if (mov == 1){
                mov = "Ingreso";
            } else {
                mov = "Gasto";
            }

            n_log.debug({title: 'Movimiento:', details: mov});
            n_log.debug({title: 'Concepto:', details: concepto});
            n_log.debug({title: 'Importe:', details: importe});
            n_log.debug({title: 'Fecha:', details: fecha});
            n_log.debug({title: 'Usuario', details: usuario});                                                            


            // Cargamos el registro de ese USUARIO
            var user = n_record.load({type: 'customrecord_ai_tb_registroej1', id: usuario});

            n_log.debug({title: 'Cargamos el registro de usuario', details: usuario});

            // Metemos los datos en jsonMovs
            var jsonMovs = user.getValue({fieldId: 'custrecord_ai_registroej1_json_mov'});

            n_log.debug({title: 'Obtenemos los movimientos anteriores en json', details: jsonMovs});

            // Preparamos el string de el movimiento nuevo
            var nuevosDatos = {Movimiento : mov , Concepto  : concepto, Importe : importe , Fecha  : fecha};

            n_log.debug({title: 'Movimiento nuevo', details: nuevosDatos});

            // Declaramos array vacio
            var info = new Array();

            if(!jsonMovs){

                n_log.debug({title: 'No tenemos movimientos previos'});
                // jsonMovs viene vacio
                info.push(nuevosDatos);

            } else {

                n_log.debug({title: 'Existen movimientos previos'});
                // jsonMovs viene con movimientos previos
                info= JSON.parse(jsonMovs);
                info.push(nuevosDatos);

            }

            infoJSON = JSON.stringify(info);

            // Metemos el valor actualizado
            user.setValue({fieldId: 'custrecord_ai_registroej1_json_mov', value: infoJSON});
            
            n_log.debug({title: 'Array en JSON format', details: infoJSON});

            var saldo = user.getValue({fieldId: 'custrecord_ai_registroej1_saldo'});

              // Ingreso o gasto?
            if( mov == 1 ){
                saldo = saldo + importe;
                n_log.debug({title: 'El movimiento es un ingreso'});
            } else {
                saldo = saldo - importe;
                n_log.debug({title: 'El movimiento es un gasto'});
            }

            user.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldo});
            
            // Guardamos el registro de USUARIO
            try {
                user.save();
                n_log.debug({title: 'Movimientos JSON actualizados correctamente.'});
            } catch (e) {
                n_log.error({details: e.message});
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
            sublistChanged: sublistChanged
        };
    }
);