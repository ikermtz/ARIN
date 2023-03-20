/*   +---------------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                         |
     |---------+------------+------------+---------------------------------------------------------------------+
     |  1.0    | Iker       |  DD/MM/YY  | Usuario preferente 01/XX/XXXX                                       |
     |---------+------------+------------+---------------------------------------------------------------------+

*/

/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript

 */
define(['N/query','N/log','N/format', 'N/record'],
    function(n_query, n_log, n_format, n_record){

        // Que datos procesamos
        function getInputData(){
        
            // n_log.debug({title: 'Inicio verificacion usuario preferente'});
    
            var fecha = new Date();
    
            var aux1 = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
            var fechamin = n_format.format({value: aux1, type: n_format.Type.DATE});
              
    
            var aux2 =  new Date(fecha.getFullYear(), fecha.getMonth()+1, 0);
            var fechamax = n_format.format({value: aux2, type: n_format.Type.DATE});
    
            // n_log.debug({title: 'Fecha inicial: ', details: fechamin});
            // n_log.debug({title: 'Fecha final: ', details: fechamax});
    
            var sql = "SELECT custrecord_ai_movimientosej1_usuario AS user, SUM (custrecord_ai_movimientosej1_importe) AS ingresos  "; 
            sql += "FROM customrecord_ai_movimientosej1_mov ";
            sql += "WHERE custrecord_ai_movimientosej1_mov = 1 "; 
            sql += "AND custrecord_ai_movimientosej1_fecha BETWEEN '" + fechamin + "' AND '" + fechamax + "' ";       
            sql += "GROUP BY custrecord_ai_movimientosej1_usuario";
            
            var queryParams = new Array();	
            var rows = new Array();	
            rows = selectAllRows(sql, queryParams );
            n_log.debug({title: 'getInputData - number of rows selected', details: rows.length});
            n_log.debug({title: 'Consulta: ', details: sql});

            return rows;
        }

        // Dar preferencia o no a cada usuario
        function map(context){      
            
            // Obtener el resultado de la busqueda de la consulta
            var registroDetalle = JSON.parse(context.value);

            // Los dos valores que pedimos en el select
            var ingresoTotal = registroDetalle.ingresos;
            var userId = registroDetalle.user;

            var usuario = n_record.load({type: 'customrecord_ai_tb_registroej1', id: userId});

            // Es preferente del mes pasado?
            var pref = usuario.getValue({fieldId: 'custrecord_ai_registroej1_pref'});
            
            // No es preferente y sus ingresos >= 1000
            if( (pref == false) && (ingresoTotal >= 1000) ){
                pref = true;
                usuario.setValue({fieldId: 'custrecord_ai_registroej1_pref', value: pref});
                n_log.debug({title: 'Nuevo usuario preferente', details: pref});
            } 
            // Es preferente y sus ingresos < 1000
            if( (pref == true) && (ingresoTotal < 1000) ){
                pref = false;
                usuario.setValue({fieldId: 'custrecord_ai_registroej1_pref', value: pref});
                n_log.debug({title: 'Un usuario ha perdido la preferencia', details: pref});
            }

            //Guardamos el record con el saldo actualizado
            try {
                var userActualizado = usuario.save();
                n_log.debug({title: 'Preferencia guardada correctamente', details: userActualizado});
            } catch (e) {
                n_log.error({details: e.message});
            }

            n_log.debug({title: 'Fin ejecución usuarios preferentes'});    
                            
            return true;
        }
		
        // No la usamos
		function reduce(context){
			log.audit({title: 'Reduce'});

        }

        // No la usamos
        function summarize(context){

			log.audit({title: 'Summarize'});
				
        }

        //Función que ejecuta una query y devuelve los registros en un array (rows de getInputData)
        function selectAllRows( sql, queryParams){
            try{
               var moreRows = true;
               var rows = new Array();
               var paginatedRowBegin = 1;
               var paginatedRowEnd;
               var pagination = 5000;  
               do {
                   paginatedRowEnd = paginatedRowBegin + pagination;
                   var paginatedSQL = 'SELECT * FROM ( SELECT ROWNUM AS ROWNUMBER, * FROM (' + sql + ' ) ) WHERE ( ROWNUMBER BETWEEN ' + paginatedRowBegin + ' AND ' + paginatedRowEnd + ')';
                   var queryResults = n_query.runSuiteQL( { query: paginatedSQL, params: queryParams } ).asMappedResults();
                   rows = rows.concat( queryResults );
                   if (queryResults.length < pagination) { moreRows = false; }
                   paginatedRowBegin = paginatedRowBegin + pagination;
               } while ( moreRows );
                }catch( e ){
                log.error( { title: 'selectAllRows - error', details: { 'sql': sql, 'queryParams': queryParams, 'error': e } } );
           }
           return rows;
       }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

});