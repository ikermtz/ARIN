/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Autor      |  DD/MM/YY  | Cod_desarrollo - Descripción desarrollo                             |
     |---------+------------+------------+---------------------------------------------------------------------+
     |   Descripción modificación                                .                                             |
     +---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */


 define(['N/log'],
 function(n_log){
     function pageInit(context){
         return true;
     }
     
     function saveRecord(context){
         return true;
     }
     
     function validateField(context){
         return true;
     }
     
     function fieldChanged(context){
        
        n_log.debug({title: 'Inicio ejecución informe importe'});

        // Coger el registro que se procesa
        var editField = context.fieldId;

        if (editField != 'custrecord_ai_movimientosej1_importe') { // Campo que no queremos
            n_log.debug({title: 'Se ha modificado un campo diferente al importe'});
            return true;
        } else{ // Campo que queremos 
            n_log.debug({title: 'Se ha modificado el importe'});

            var currentrec = context.currentRecord;

            n_log.debug({title: 'Entra aqui'});

            var importe = currentrec.getValue({fieldId: 'custrecord_ai_movimientosej1_importe'});

            n_log.debug({title: 'Importe obtenido'});

            // Mirar que tipo de movimiento es
            var mov = 1;
            if ( importe < 0 ){
                mov = 2;
            }

            n_log.debug({title: 'Movimiento detectado'});

            currentrec.setValue({fieldId: 'custrecord_ai_movimientosej1_mov', value: mov});

            n_log.debug({title: 'Fin ejecucion informe importe'});   
        }

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
