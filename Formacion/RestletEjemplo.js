/*   +-------------------------------------------------------------------------------------------------+
     | Versión |   Autor    |   Fecha    | Descripción                                                 |
     |---------+------------+------------+-------------------------------------------------------------+
     |  1.0    | Leire G.   |  07/03/23  | Creación del Restlet                                        |
	 |---------+------------+------------+-------------------------------------------------------------+
     |   Restlet de operaciones.                                                                       |
     |    - Get: operacionGet -> Consulta de operaciones                                               |
     |    - Post: operacionPost -> Creación/Actualización de operaciones                               |
     | Se reciben por parametros la info del movimiento y el id de usuario, si el id no existiera se   |
     | creara un nuevo usuario con un primer ingreso de bonificaión con un importe de 100€; si el      |
     | movimiento dejara al usuario sin saldo, devuelve un error; si el usuario existe y tiene saldo   |
     | suficiente; se actualizará el saldo y se generará el movimiento.                                |
     |                                                                                                 |
     +---------+------------+------------+-------------------------------------------------------------+
*/
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 * @NModuleScope Public 
 */
 define(['N/search','N/record', 'N/error'],
 function(n_search, n_record, n_error) {
     function _get(param) {
      return 'Has usado un Get';
     }
	 
     function _post(payload) {   
        //parametros aceptados
        const parametrosAceptados = ["id_usu", "nombre", "apellidos", "iban", "telefono",
                                     "tipo", "concepto", "importe" ];
        var idnuevousu;
        var movimiento;
        var existeUsuario = false;
        
        //Validar que todos los parámetros recibidos son alguno de los definidos
        for (param in payload){
            if(parametrosAceptados.indexOf(param) < 0){
                return n_error.create({name: 'ERROR', message: 'El parámetro ' + param + ' no existe en el webservice.'}).message;
            }
        }    
            //Validar que recibimos el usuario, si no, crear usuario nuevo           
            // recogemos el usuario existente que tiene el mismo id recogido anteriormente
            var usuario;
            if (!!payload.id_usu) { //si payload.id_usu tiene valor comprobamos si el usuario existe  
                usuario = getUsuario(payload.id_usu);
                log.debug({
                    title: 'getUsuario',
                    details: 'ID:  ' + usuario });
                if (usuario>0) {
                    existeUsuario = true
                    log.debug({ title: 'existeUsuario debería ser true '});

                }             
            }
            log.debug({ title: 'valor real de existeUsuario: ',  details: existeUsuario });

            if(!existeUsuario){ //si no existe el usuario
                log.debug({ title: 'si no existe el usuario lo crea'});
                // crear usuario y recoger el id
                idnuevousu = crearNuevoUsuario(payload);
                // crear el primer movimiento con importe de 100 por bonificacion de nuevo usuario
                movimiento = crearNuevoMovimiento(payload, idnuevousu, existeUsuario);
                //actualizar saldo
                //nuevoUsuActualizarSaldo(idnuevousu, 100, 1);
                nuevoUsuActualizarSaldo(idnuevousu);

            }else{ // si el usuario existe comprobamos si tiene saldo suficiente
                log.debug({ title: 'el usuario existe'});
                if (saldoSuficiente(payload.id_usu, payload.importe, payload.tipo)) {
                    log.debug({ title: 'el usuario tiene saldo suficiente'});
                    // crear nuevo movimiento
                    movimiento = crearNuevoMovimiento(payload, null, existeUsuario);
                    //actualizar saldo
                    actualizarSaldo(payload.id_usu, payload.importe, payload.tipo);
                    
                }else{ //si no tiene saldo suficiente salta error
                    return n_error.create({name: 'ERROR', message: 'Saldo insuficiente.'}).message;
                }                 
            }
        
        return movimiento;		
     }
	 
     function _delete() {
        return 'Has usado un Delete';
     }

     function getUsuario(id_usu){  //hace una busqueda en un record y devuelve un json 
        // filters -> criteria de una saved search
        // columns -> results de una saved search        

        var myCustomListSearch  = n_search.create({   
            //type: id del record         
            type: 'customrecord_ai_tb_usuarios',
            filters: ['internalid', n_search.Operator.IS, id_usu]
            });  
            
            var usuario = myCustomListSearch.run().getRange({ start: 0, end: 1 });
            for (var row in usuario) return usuario[row].id;
            return null;                 
    }            


     function crearNuevoUsuario(payload) {
        // creamos un nuevo registro en el custom record ARIN - Usuarios:
        var newUsuario = n_record.create({
            type: 'customrecord_ai_tb_usuarios', 
            isDynamic: true
        });

        // damos valores a los fields del nuevo registro:
        newUsuario.setValue({
            fieldId: 'custrecord_ai_usu_nombre',
            value: payload.nombre
        });
        newUsuario.setValue({
            fieldId: 'custrecord_ai_usu_apellidos',
            value: payload.apellidos
        });
        newUsuario.setValue({
            fieldId: 'custrecord_ai_usu_telefono',
            value: payload.telefono
        });
        newUsuario.setValue({
            fieldId: 'custrecord_ai_usu_iban',
            value: payload.iban
        });

        try { // guardamos el nuevo record
            var newUsuarioId = newUsuario.save();
            log.debug({
                title: 'Usuario record created successfully',
                details: 'usuario record ID:  ' + newUsuarioId });
        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
        return newUsuarioId;         
     }

     function actualizarSaldo(id, importe, tipo_movimiento) {
        
        // recogemos el usuario existente que tiene el mismo id recogido anteriormente
        var usuario = n_record.load({
            type: 'customrecord_ai_tb_usuarios',
            id: id,
            isDynamic: true
        });
        //obtenemos su saldo actual
        var saldo = usuario.getValue({
            fieldId: 'custrecord_ai_usu_saldo'
        });

        log.debug({ title: 'Saldo INICIAL: ',  details: saldo });

        if (tipo_movimiento == 1) { // 1 = ingreso
            saldo = parseFloat(saldo) + parseFloat(importe);                       
        } else { // 2 = gasto 
            saldo = parseFloat(saldo) - parseFloat(importe);
        }
        log.debug({ title: 'Saldo ACTUALIZADO: ',  details: saldo });

        // guardamos el saldo actualizado
        usuario.setValue({
            fieldId: 'custrecord_ai_usu_saldo',
            value: saldo
        });

        // Save the record
        usuario.save();
     }

     function nuevoUsuActualizarSaldo(id) {
        
        // recogemos el usuario existente que tiene el mismo id recogido anteriormente
        var usuario = n_record.load({
            type: 'customrecord_ai_tb_usuarios',
            id: id,
            isDynamic: true
        });
        //obtenemos su saldo actual
        var saldo  = 100;                       
        
        log.debug({ title: 'Saldo nuevo usuario: ',  details: saldo });

        // guardamos el saldo actualizado
        usuario.setValue({
            fieldId: 'custrecord_ai_usu_saldo',
            value: saldo
        });

        // Save the record
        usuario.save();
     }

     function saldoSuficiente(id, importe, tipo_movimiento) {
        
        // recogemos el usuario existente que tiene el mismo id recogido anteriormente
        var usuario = n_record.load({
            type: 'customrecord_ai_tb_usuarios',
            id: id,
            isDynamic: true
        });
        // recogemos el saldo actual de ese cliente
        var saldo = usuario.getValue({
            fieldId: 'custrecord_ai_usu_saldo'
        });
        log.debug({ title: 'Saldo del record del usuario: ',  details: saldo });

        var saldo_suficiente = true;
             
        //validamos que el movimiento se puede realizar
        if (tipo_movimiento==2 && saldo-importe < 0) { 
            // si es un gasto y el saldo queda negativo -> saldo insuficiente
            saldo_suficiente = false;               
        }
        log.debug({ title: 'Saldo suficiente: ',  details: saldo_suficiente });
        return saldo_suficiente;        
     }

     function crearNuevoMovimiento(payload, id_usu, existeUsuario) {
        /* diferenciamos si es l abonificaión de usuario nuevo o no, para ello miramos el parametro payload.id_usu, 
           si no tiene valor, usaremos el parametro de entrada id_usu, que es el id de usuario del usuario recién creado    
        */
        // creamos un nuevo registro en el custom record ARIN - Movimientos:
        var newMovimento = n_record.create({
            type: 'customrecord_ai_tb_movimientos',  
            isDynamic: true
        });

        //Obtener los parámetros recibidos en la llamada y asignarlos según si es el movimiento de un usuario nuevo o no
        var id ;
        var importe;
        var concepto;
        var tipoMovimiento;

        if (existeUsuario) { 
            //si el usuario existe añadimos el nuevo movimiento (ya habiendo comprobado que tiene saldo si es un gasto)
            id = payload.id_usu;
            importe = payload.importe;
            concepto = payload.concepto;
            tipoMovimiento = payload.tipo;                    
        log.debug({ title: 'id usu existente',  details: id });

        }else { //si es un nuevo usuario se crea el movimiento de bonificaión de usuario
            id = id_usu
            importe = 100;
            concepto = 'Bonificación de nuevo usuario';
            tipoMovimiento = 1;                    
        log.debug({ title: 'id nuevo usu',  details: id });
        } 

        // damos valores a los fields del nuevo registro:
        newMovimento.setValue({
            fieldId: 'custrecord_ai_movi_tipodemovimiento',
            value: tipoMovimiento
        });
        newMovimento.setValue({
            fieldId: 'custrecord_ai_movi_concepto',
            value: concepto
        });
        newMovimento.setValue({
            fieldId: 'custrecord_ai_movi_importe',
            value: importe
        });
        newMovimento.setValue({
            fieldId: 'custrecord_ai_movi_fecha',
            value: new Date()
        });
        newMovimento.setValue({
            fieldId: 'custrecord_ai_movi_idusuario',
            value: id
        });

        // guardamos el nuevo record
        try { 
            var newMovimentoId = newMovimento.save();
            log.debug({
                title: 'Movimiento record created successfully',
                details: 'movimiento record ID:  ' + newMovimentoId
            });
        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
        return newMovimento;
    }

     return {
         get: _get,
         post: _post,
         delete: _delete
     };
 });
