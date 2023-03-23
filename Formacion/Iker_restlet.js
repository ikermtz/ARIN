/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    |  Iker      |  XX/XX/XX  | Restlet ejercicio 4 formación                               |
	 |---------+------------+------------+-------------------------------------------------------------+
*/
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 * @NModuleScope Public 
 */


 define(['N/record', 'N/log', 'N/search', 'N/error'],
 function(n_record, n_log, n_search, n_error) {
    
    function _get(param) {
        return 'Has usado un Get';
    }
	 
    function _post(payload) {

        // Obtenemos los 5 campos de un movimiento 
        const parametrosAceptados = ["movimiento", "concepto", "importe", "userId"];
        
        // Variables para cada campo
        var mov = payload.movimiento;
        var concepto = payload.concepto;
        var importe = payload.importe;
        var userId = payload.userId;

        for (param in payload){
            
            if(parametrosAceptados.indexOf(param) < 0){
                return n_error.create({name: 'ERROR', message: 'El parámetro ' + param + ' no existe en el webservice.'}).message;
            }
                                    
            //Validar que recibimos el código de operacion
            if(!payload.movimiento){
                return n_error.create({name: 'ERROR', message: 'Se necesita el recibir el movimiento.'}).message;
            }
        }

        // Mensaje que mostraremos en la petición de postman
        var infoPostman;

        // Recibimos un movimiento con informacion correcta
        if(mov != null){
                    
            // Existe usuario con ese id
            if (!busqueda(userId)){

                n_log.debug({title: 'No existe ningun usuario con ese id.'});
                noExiste(mov, concepto, importe);
                infoPostman = 'Petición enviada correctamente. Se creara un usuario con el movimiento de bienvenida y con el movimiento de la petición.';

            // Existe el usuario    
            } else {

                // Necesitamos ciertos datos para ver si tiene saldo suficiente
                var user = n_record.load({type: 'customrecord_ai_tb_registroej1', id: userId});
                var saldo = user.getValue({fieldId: 'custrecord_ai_registroej1_saldo'});

                // Saldo insuficiente
                if( (saldo < importe) & (mov ==2) ){

                    n_log.debug({title: 'Existe un usuario con ese id pero no tiene saldo suficiente'});
                    infoPostman =  n_error.create({name: 'ERROR', message: 'ERROR: Movimiento denegado por saldo insuficiente.'}).message;
        
                // Saldo suficiente
                } else {
                
                    n_log.debug({title: 'Existe un usuario con ese id y tiene saldo suficiente'});
                    existe(mov, concepto, importe, userId);
                    infoPostman = 'Petición enviada correctamente. Se creara el movimiento y se actualizara el saldo de ese usuario.';

                }
            }
            
        // Recibimos un movimiento sin informacion
        } else {
            infoPostman = n_error.create({name: 'ERROR', message: 'Se necesita el recibir un movimiento no vacio.'}).message;
        }
        
        
		return infoPostman;
    }
	 
    function _delete() {
        return 'Has usado un Delete';
    }


    // FUNCIONES AUXILIARES

    // Si el usuario no existe tenemos que crearlo y gestionar el movimiento de regalo
    function noExiste(mov, concepto, importe){
        
        //Creamos el nuevo usuario
        var newUser = n_record.create({type: 'customrecord_ai_tb_registroej1', isDynamic: true});

        // Actualizamos el saldo
        var saldoAct;

        // Ingreso
        if( mov == 1 ){

            saldoAct = 100 + importe;

        // Gasto
        } else {

            saldoAct = 100 - importe;

        }

        n_log.debug({title: 'Saldo 1', saldoAct});

        newUser.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldoAct});
        
        // Guardamos el usuario y sacamos el id
        try {
            var newId = newUser.save({enableSourcing: true, ignoreMandatoryFields: false});
            n_log.debug({title: 'Movimiento de regalo creado correctamente.'});
        } catch (e) {
            n_log.error({details: e.message});
        }

        n_log.debug({title: 'Saldo 2', saldoAct});

        n_log.debug({title: 'New id', details: newId});
    
        // Información movimiento regalo
        var movRegalo = 1;
        var conceptoRegalo = 'Regalo por crear una cuenta nueva';
        var importeRegalo = 100;        

        // Creamos el movimiento de regalo
        generarMovimiento(movRegalo, conceptoRegalo, importeRegalo, newId);

        // Creamos el movimiento de la petición
        generarMovimiento(mov, concepto, importe, newId);

        n_log.debug({title: 'Saldo 3', saldoAct});

        return true;
    }

    // Tiene saldo suficiente
    function existe(mov, concepto, importe, userId){
        
        // Necesitamos ciertos datos para actualizar el saldo del usuario
        var user = n_record.load({type: 'customrecord_ai_tb_registroej1', id: userId});
        var saldo = user.getValue({fieldId: 'custrecord_ai_registroej1_saldo'});

        // Ingreso 
        if( mov == 1 ){

            saldo = saldo + importe;

        // Gasto
        } else {

            saldo = saldo - importe;

        }

        // Creamos el movimiento de la petición
        generarMovimiento(mov, concepto, importe, userId);

        // Actualizamos el saldo
        user.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldo});
        
        // Guardamos el usuario con saldo actualizado
        try {
            user.save();
        } catch (e) {
            n_log.error({details: e.message});
        }

        return true;
    
    }

    function generarMovimiento(mov, concepto, importe, userId){
        
        var newMov = n_record.create({type: 'customrecord_ai_movimientosej1_mov', isDynamic: true});

        var fecha = new Date();
        
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_usuario', value: userId});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_mov', value: mov});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_concepto', value: concepto});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_fecha', value: fecha});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_importe', value: importe});

        try {
            newMov.save();
            n_log.debug({title: 'Movimiento creado correctamente.'});
        } catch (e) {
            n_log.error({details: e.message});
        }
    }


    function busqueda(userId){
        
        var existe = false;
        var res = buscar(userId);
        n_log.debug({details: res});
        if (res != null){
            existe = true;
        }
        return existe;
        
    }
    
    function buscar(userId){
        var search = n_search.create({
            type: 'customrecord_ai_tb_registroej1',
            filters: ['internalId', n_search.Operator.IS, userId],
            columns: [n_search.createColumn({name: 'internalId', label: 'id'})]
        }).run().getRange({start: 0, end: 1});

        for (var row in search) return search[row].id;
        
    }

    /*Postman:
        {
            "movimiento": "2",
            "concepto": "Bufanda real betis",
            "importe": "1",
            "userId": "1"
        }
    */

    return {
        get: _get,
        post: _post,
        delete: _delete
    };
}); 