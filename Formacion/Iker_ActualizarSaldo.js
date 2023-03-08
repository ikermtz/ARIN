/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Iker      |  DD/MM/YY  | Cod_desarrollo - Descripción desarrollo                             |
     |---------+------------+------------+---------------------------------------------------------------------+
     |   Descripción modificación                                .                                             |
     +---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */

define(['N/record','N/log'],
function(n_record, n_log) {

    function onAction(context) { 
        
        n_log.debug({title: 'Inicio ejecución actualizar saldo'});


        // Coger el registro que se procesa
        var newrecord = context.newRecord;

        var userId = newrecord.getValue({fieldId: 'custrecord_ai_movimientosej1_usuario'});
        var mov = newrecord.getValue({fieldId: 'custrecord_ai_movimientosej1_mov'});
        var importe = newrecord.getValue({fieldId: 'custrecord_ai_movimientosej1_importe'});
       
        n_log.debug({title: 'Se procesa el registro'});

        // Obtener datos del usuario 
        var user = n_record.load({type: 'customrecord_ai_tb_registroej1', id: userId});
        var saldo = user.getValue({fieldId: 'custrecord_ai_registroej1_saldo'});

        n_log.debug({title: 'Recogemos datos del usuario'});

        // Ingreso o gasto?
        if( mov == 1 ){
            saldo = saldo + importe;
            n_log.debug({title: 'El movimiento es un ingreso'});
        } else {
            saldo = saldo - importe;
            n_log.debug({title: 'El movimiento es un gasto'});
        }

        // Cargar el nuevo saldo
        user.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldo});

        n_log.debug({title: 'Saldo actualizado correctamente'});
        
        //Guardamos el record con el saldo actualizado
        try {
            var userActualizado = user.save();
            n_log.debug({title: 'Movimiento guardado correctamente', details: userActualizado});
        } catch (e) {
            n_log.error({details: e.message});
        }

        n_log.debug({title: 'Fin ejecución actualizar saldo'});         
    }

    return {
        onAction: onAction
    };
}
);
