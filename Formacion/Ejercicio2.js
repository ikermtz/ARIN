/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Iker       |  DD/MM/YY  | Cod_desarrollo - Descripción desarrollo                             |
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
        
        n_log.debug({title: 'Inicio ejecución Ejercicio2'});

        var currentDate = new Date();
        var saldoRegalo = 100.00;

        // Coger el registro que se procesa
        var newrecord = context.newRecord;
        var userId = newrecord.getValue({fieldId: 'id'});
        newrecord.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldoRegalo});
        n_log.debug({title: 'se procesa el registro'});
        
        // Nuevo custom record (Movimiento)
        var newMov = n_record.create({type: 'customrecord_ai_movimientosej1_mov'});

        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_usuario', value: userId});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_mov', value: 1});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_concepto', value: "Regalo por crear una cuenta"});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_fecha', value: currentDate});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_importe', value: saldoRegalo});
        n_log.debug({title: 'se genera el movimiento'});


        // Guardar el movimiento generado
        try {
            var newMomInfo = newMov.save();
            n_log.debug({title: 'Creado correctamente', details: newMomInfo});
        } catch (e) {
            n_log.error({details: e.message});
        }

        n_log.debug({title: 'Fin ejecución Ejercicio2'});         
    }

    return {
        onAction: onAction
    };
}
);

