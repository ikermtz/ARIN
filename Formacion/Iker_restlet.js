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
        const parametrosAceptados = ["movimiento", "concepto", "importe", "fecha", "usuario"];
        
        // Variables para cada campo
        var mov = payload.movimiento;
        var concepto = payload.concepto;
        var importe = payload.importe;
        var fecha = payload.fecha;
        var usuario = payload.usuario;

        for (param in payload){
            
            if(parametrosAceptados.indexOf(param) < 0){
                return n_error.create({name: 'ERROR', message: 'El parámetro ' + param + ' no existe en el webservice.'}).message;
            }
                                    
            //Validar que recibimos el código de operacion
            if(!payload.movimiento){
                return n_error.create({name: 'ERROR', message: 'Se necesita el recibir el movimiento.'}).message;
            }

            // Recibimos un movimiento con informacion correcta
            if(mov != null){

                // Obtenemos el usuario para verificar si existe o no
                var usuario = payload.usuario;
                var user = n_record.load({type: 'customrecord_ai_tb_registroej1', id: usuario});


                // Existe el usuario?
                if (!user){

                    noExiste();
                    n_log.debug({title: 'No existe ningun usuario con ese id.'});

                // Existe el usuario    
                } else {
                    existe(mov, concepto, importe, fecha, user);
                    n_log.debug({title: 'Existe un usuario con ese id.'});

                }


            // Recibimos un movimiento sin informacion
            } else {
                return n_error.create({name: 'ERROR', message: 'Se necesita el recibir un movimiento no vacio.'}).message;
            }
        
        }
		return 'Has usado un Post';
    }
	 
    function _delete() {

        return 'Has usado un Delete';

    }


    // FUNCIONES AUXILIARES

    // Si el usuario no existe tenemos que crearlo y gestionar el movimiento de regalo
    function noExiste(){
        
        crearUsuario();

        return true;
    }

    function crearUsuario(){
        
        var newUser = n_record.create({type: 'customrecord_ai_tb_registroej1'});

        newUser.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: 0});
        newUser.setValue({fieldId: 'custrecord_ai_registroej1_pref', value: false});

        // Guardamos el nuevo usuario
        try {
            newUser.save();
            n_log.debug({title: 'Movimiento de regalo creado correctamente.'});
        } catch (e) {
            n_log.error({details: e.message});
        }


        // NS SI ESTO SE PUEDE HACER
        var newId = newUser.getValue({fieldId: 'custrecord_ai_registroej1_id'});

        primerMovimiento(newId);

        return true;
    }

    function primerMovimiento(newId){
        
        n_log.debug({title: 'Vamos a crear el movimiento de regalo.'})
        // Creamos un nuevo record de tipo movimiento
        var newMov = n_record.create({type: 'customrecord_ai_movimientosej1_mov'});
        var saldoRegalo = 100;

        // Metemos los valores del movimiento de regalo
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_usuario', value: newId});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_mov', value: 1});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_concepto', value: "Regalo por crear una cuenta"});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_fecha', value: fecha});
        newMov.setValue({fieldId:'custrecord_ai_movimientosej1_importe', value: saldoRegalo});
        
        // Guardamos el movimiento
        try {
            var newMomInfo = newMov.save();
            n_log.debug({title: 'Movimiento de regalo creado correctamente.', details: newMomInfo});
        } catch (e) {
            n_log.error({details: e.message});
        }

        return true;
    }

    // Mirar si hay saldo suficiente
    function existe(mov, concepto, importe, fecha, user){
        
        var saldo = user.getValue({fieldId: 'custrecord_ai_registroej1_saldo'});

        // Saldo insuficiente
        if( (saldo < importe) & (mov ==2) ){
         
            devolverError();

        // Saldo suficiente
        } else {
            
            generarMovimiento(mov, concepto, importe, fecha, user, saldo);

        }
        
        return true;
    }

    function generarMovimiento(mov, concepto, importe, fecha, user, saldo){
        
        // Ingreso 
        if( mov == 1 ){
            saldo = saldo + importe;

        // Gasto
        } else {
            saldo = saldo - importe;
        }

        // Actualizamos saldo
        user.setValue({fieldId: 'custrecord_ai_registroej1_saldo', value: saldo});

        // Guardamos el saldo actualizado
        try {
            user.save();
            n_log.debug({title: 'Saldo actualizado correctamente.'});
        } catch (e) {
            n_log.error({details: e.message});
        }

        // Creamos el movimiento
        var newMov = n_record.create({type: 'customrecord_ai_movimientosej1_mov', isDynamic: true});

        // Le metemos los valores al movimiento
        newMov.setValue({fieldId: 'custrecord_ai_movimientosej1_mov', value: mov});
        newMov.setValue({fieldId: 'custrecord_ai_movimientosej1_concepto', value: concepto});
        newMov.setValue({fieldId: 'custrecord_ai_movimientosej1_importe', value: importe});
        newMov.setValue({fieldId: 'custrecord_ai_movimientosej1_fecha', value: fecha});
        newMov.setValue({fieldId: 'custrecord_ai_movimientosej1_usuario', value: user});

        // Guardamos el movimiento creado
        try { 
            newMov.save();
            n_log.debug({title: 'Nuevo movimiento creado.'});
        } catch (e) {
            log.error({title: e.name, details: e.message});
        }
        return true;
    }

    function devolverError(){
        
        return n_error.create({name: 'ERROR', message: 'No se puede crear el movimiento ya que no hay saldo suficiente'}).message;

    }

    



    return {
        get: _get,
        post: _post,
        delete: _delete
    };
 }); 