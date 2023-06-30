/*   +---------------------------------------------------------------------------------------------------------+
    | Versión |   Autor    |   Fecha    | Descripción                                                         |
    |---------+------------+------------+---------------------------------------------------------------------+
    |  1.0    | S.López    |  06/03/23  | ICL_E005 - Actualización campos pedido desde albarán/recepción      |
    |  1.1    | S.López    |  23/03/23  | ICL_E027 - Precio transporte en albarán y recepción                 |
    |---------+------------+------------+---------------------------------------------------------------------+
    |   Traspasar modificaciones de la recepción a la línea de pedido.                                        |
    +---------+------------+------------+---------------------------------------------------------------------+
*/

/**
 * @NScriptType WorkflowActionScript
 */

function editItemReceipt10(id, type, form){
	
	nlapiLogExecution('DEBUG','Inicio ejecución editItemReceipt10_WF');

    if(type == "xedit"){ 
        return true;
    }

    var receipt = nlapiGetNewRecord();
    var receiptOld = nlapiGetOldRecord();

    // Inicializar variables
    var modificarAlbProv = 0;
    var modificarDate = 0;
    var modificarDateAlbProv = 0;
    //++[SLV] ICL_E027. (23/03/2023)
    //Añadir nueva lógica para nuevos campos editables
    var modificarTarifaTrans = 0;
    var modificarAgenciaTrans = 0;
    //--[SLV] ICL_E027. (23/03/2023)

    //Buscamos los id la asignación y el pedido a modificar
    var receiptId = receipt.getFieldValue('id');
    nlapiLogExecution('DEBUG','receiptId: ', receiptId);
    var asignacionId = obtenerAsignacion(receiptId);
    nlapiLogExecution('DEBUG','asignacionId: ',asignacionId);
    var purchaseOrderId = receipt.getFieldValue('createdfrom');
    nlapiLogExecution('DEBUG','purchaseOrderId: ', purchaseOrderId);
	
	if(asignacionId){
		
		//++[SLV] ICL_E027. (08/05/2023)
        //Comprobamos si la asignación tiene albarán (venta directa) -- Si la cantidad nueva es mayor que la vieja
        //--Cargamos la asignación
        var asignacion = nlapiLoadRecord('customrecord_x_tb_geas', asignacionId);
        var albaranVentaDirecta = asignacion.getFieldValue('custrecord_x_as_fulfillment'); 

        if(!!albaranVentaDirecta){

            //Nos recorremos la línea de la recepción para actualizar en el albarán antes de que haga todo
            var numLineas = receipt.getLineItemCount('item');

            for(var i = 1; i <= numLineas; i++){

                if(receipt.getLineItemValue('item','quantity', i) < receiptOld.getLineItemValue('item', 'quantity', i)){
                    
                    nlapiLogExecution('DEBUG','albaranVentadirecta: ', albaranVentaDirecta);
                    if( ( receipt.getLineItemValue('item', 'quantity', i) != receiptOld.getLineItemValue('item', 'quantity', i) ) ||
                     ( receipt.getLineItemValue('item', 'location', i) != receiptOld.getLineItemValue('item','location',i) ) ||
                     ( receipt.getFieldValue('custbody_ai_transport_rate') != receiptOld.getFieldValue('custbody_ai_transport_rate') ) ||
                     ( receipt.getFieldValue('custbody_ai_transport_agency') != receiptOld.getFieldValue('custbody_ai_transport_agency') ) || 
                     ( receipt.getFieldValue('trandate') != receiptOld.getFieldValue('trandate') ) ){                      

                        //Modificamos el albarán para que se ejecute el workflow
                        var albaran = nlapiLoadRecord('itemfulfillment',albaranVentaDirecta);
                        nlapiLogExecution('DEBUG','albaran: line 69 ', albaran);

                        if(receipt.getFieldValue('custbody_ai_transport_rate') != receiptOld.getFieldValue('custbody_ai_transport_rate')){
                            albaran.setFieldValue('custbody_ai_transport_rate', receipt.getFieldValue('custbody_ai_transport_rate')); 
                        }
                        if(receipt.getFieldValue('custbody_ai_transport_agency') != receiptOld.getFieldValue('custbody_ai_transport_agency')){
                            albaran.setFieldValue('custbody_ai_transport_agency', receipt.getFieldValue('custbody_ai_transport_agency')); 
                        }
                        if(receipt.getFieldValue('trandate') != receiptOld.getFieldValue('trandate')){
                            albaran.setFieldValue('trandate', receipt.getFieldValue('trandate')); 
                        }

                        var numLineasAlb = albaran.getLineItemCount('item');
                        for(var l = 1; l <= numLineasAlb; l++){

                           //Validar que el artículo y la cantidad original coinciden en la recepción y albarán
                            if( (receiptOld.getLineItemValue('item', 'quantity', i) == albaran.getLineItemValue('item', 'quantity', l) ) && (receipt.getLineItemValue('item', 'item',i) == albaran.getLineItemValue('item', 'item', l)) ){
                                if(receipt.getLineItemValue('item','quantity',i) != receiptOld.getLineItemValue('item','quantity', i)){
                                   
                                    albaran.selectLineItem('item', l);
                                    nlapiLogExecution('DEBUG', 'Cantidad: ', receiptOld.getLineItemValue('item', 'quantity', i));
                                    albaran.setLineItemValue('item', 'quantity', l, receipt.getLineItemValue('item', 'quantity', i)); 

                                    var inventorydetail = albaran.editCurrentLineItemSubrecord('item', 'inventorydetail');
                                    inventorydetail.setLineItemValue('inventoryassignment', 'quantity', 1, receipt.getLineItemValue('item', 'quantity', i));  

                                    inventorydetail.commitLineItem('inventoryassignment');
                                    inventorydetail.commit();
                                    albaran.commitLineItem('item');
                                }
                                /* Si cambia la location en en la recepcion, en el albaran no tiene que actualizarse 
                                if(receipt.getLineItemValue('item', 'location', i) != receiptOld.getLineItemValue('item', 'location', i)){
                                    albaran.setLineItemValue('item', 'location', l, receipt.getLineItemValue('item','location',i)); 
                                }
                                */ 
                            }
                        }
                        nlapiSubmitRecord(albaran, true, false);
                        var asignacion = nlapiLoadRecord('customrecord_x_tb_geas', asignacionId);
                    }
                }
            }
        }
        //--[SLV] ICL_E027. (08/05/2023)
        //Comprobamos si se han modificado los campos de cabecera de la recepción
		
		// Variables campos cabecera
        var ap = receipt.getFieldValue('custbody_x_albaran_prov');
        var apOld = receiptOld.getFieldValue('custbody_x_albaran_prov');

        var date = receipt.getFieldValue('trandate');
        var dateOld = receiptOld.getFieldValue('trandate');

        var dateAP = receipt.getFieldValue('custbody_x_fecha_alb_proveedor');
        var dateAPold = receiptOld.getFieldValue('custbody_x_fecha_alb_proveedor');

        var tr = receipt.getFieldValue('custbody_ai_transport_rate'); 
        var trOld = receiptOld.getFieldValue('custbody_ai_transport_rate');

        var ta = receipt.getFieldValue('custbody_ai_transport_agency');
        var taOld = receiptOld.getFieldValue('custbody_ai_transport_agency');

        // Comprobar cambios cabecera albaran
        if(ap == null){
            ap = '';
        } else if(apOld == null){
            apOld = '';
        } else if(ap!=apOld){
            modificarAlbProv = 1;
            nlapiLogExecution('DEBUG', 'Modifica albaran proveedor');
        } var apaux = ap + '*';
        var apoldaux = apOld + '*';
        if(apaux!=apoldaux){ 
            modificarAlbProv = 1;
            nlapiLogExecution('DEBUG', 'Modifica albaran proveedor');
        }

        if(date == null){
            date = '';
        } else if(dateOld == null){
            dateOld = '';
        } else if(date!=dateOld){
            modificarDate = 1;
            nlapiLogExecution('DEBUG', 'Modifica fecha');
        } var dateaux = date + '*';
        var dateoldaux = dateOld + '*';
        if(dateaux!=dateoldaux){ 
            modificarDate = 1;
            nlapiLogExecution('DEBUG', 'Modifica fecha');
        }

        if(dateAP== null){
            dateAP= '';
        } 
        if(dateAPold == null){
            dateAPold = '';
        }
        if(!!dateAP){
            if(!!dateAPold){
                if(dateAP!=dateAPold){
                    modificarDateAlbProv = 1;
                    nlapiLogExecution('DEBUG', 'Modifica fecha albaran proveedor');
                }
            }
            else{
                modificarDateAlbProv = 1;
                nlapiLogExecution('DEBUG', 'Modifica fecha albaran proveedor');
            }
        }
        else{
            if(!!dateAPold){
                modificarDateAlbProv = 1;  
                nlapiLogExecution('DEBUG', 'Modifica fecha albaran proveedor');       
            }
        }
        //++[SLV] ICL_E027. (23/03/2023)
        //Añadir nueva lógica para nuevos campos editables
        if(tr == null){
            tr = '';
        } else if(trOld == null){
            trOld = '';
        } else if(tr!=trOld){            
            modificarTarifaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica tarifa de transporte');
        } var traux = tr + '*';
        var troldaux = trOld + '*';
        if(traux!=troldaux){ 
            modificarTarifaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica tarifa de transporte');
        }

        if(ta == null){
            ta = '';
        } else if(taOld == null){
            taOld = '';
        } else if(ta!=taOld){
            modificarAgenciaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica agencia de transporte');
        } var taaux = ta + '*';
        var taoldaux = taOld + '*';
        if(taaux!=taoldaux){ 
            modificarAgenciaTrans = 1;
            nlapiLogExecution('DEBUG', 'Modifica agencia de transporte');
        }
		//--[SLV] ICL_E027. (23/03/2023)

        if(modificarAlbProv == 1){
            asignacion.setFieldValue('custrecord_x_geas_vendordeliverynumber', receipt.getFieldValue('custbody_x_albaran_prov')); 
        } 

        //++[SLV] ICL_E027. (23/03/2023)
        //Añadir modificación nuevos campos editables
        if(modificarTarifaTrans == 1){
            asignacion.setFieldValue('custrecord_x_geas_rateprice', receipt.getFieldValue('custbody_ai_transport_rate'));
        }
        if(modificarAgenciaTrans == 1){
            asignacion.setFieldValue('custrecord_x_geas_transprovider', receipt.getFieldValue('custbody_ai_transport_agency'));
        }
		//--[SLV] ICL_E027. (23/03/2023)

        //Nos recorremos las líneas de la recepción para validar que ha cambiado
        var numLineasreceipt = receipt.getLineItemCount('item');

        for(var i = 1; i <= numLineasreceipt; i++){
            
            //Inicializar variables
            var modificarCantidad = 0;
            var modificarLocation = 0;

            //Comprobamos si han cambiado los campos a nivel de línea
            if(receipt.getLineItemValue('item','quantity', i) != receiptOld.getLineItemValue('item', 'quantity', i)){
                modificarCantidad = 1;
                nlapiLogExecution('DEBUG', 'Modifica cantidad');
            }
            if(receipt.getLineItemValue('item', 'location', i) != receiptOld.getLineItemValue('item', 'location', i)){
                modificarLocation = 1;
                nlapiLogExecution('DEBUG', 'Modifica location');
            } 
			
			//Actualizamos las líneas de la asignación
            if(modificarCantidad == 1 || modificarLocation == 1 || modificarDate == 1  || modificarAlbProv == 1){

                //Cogemos de la recmach porque es en la que tenemos la línea relacionada del albarán
                var numLineasAsig = asignacion.getLineItemCount('recmachcustrecord_x_geasli_parent');
                nlapiLogExecution('DEBUG','numlineaAsig: ', numLineasAsig); 
                for(var j = 1; j <= numLineasAsig; j++){

                    var lineaAsig = asignacion.getLineItemValue('recmachcustrecord_x_geasli_parent', 'id', j);
                    nlapiLogExecution('DEBUG','lineaAsig: ', lineaAsig); 

                    //Cargar lineaAsignacion
                    var asignacionLin = nlapiLoadRecord('customrecord_x_tb_geasline',lineaAsig); 
                    nlapiLogExecution('DEBUG', 'asignacionLin: ', asignacionLin);

                    // Actualizar la línea que tenga mismo artículo y cantidad antigua
                    var articuloLin = asignacionLin.getFieldValue('custrecord_x_geasli_item');
                    nlapiLogExecution('DEBUG', 'Linea articulo: ', receipt.getLineItemValue('item', 'item', i));
                    nlapiLogExecution('DEBUG', 'Linea articulo 2: ', articuloLin);
                    var cantidadLin = receipt.getLineItemValue('item', 'quantity', i);
                    //asignacionLin.getFieldValue('custrecord_x_geasli_qty');
                    nlapiLogExecution('DEBUG', 'Cantidad actual: ',  cantidadLin);
                    nlapiLogExecution('DEBUG', 'Cantidad anterior: ', receiptOld.getLineItemValue('item', 'quantity', i));
                    if( articuloLin == receipt.getLineItemValue('item', 'item',  i) && cantidadLin != receiptOld.getLineItemValue('item', 'quantity', i)){
                        if(modificarCantidad == 1){
                            //Hay que actualizar el custpage, como si lo hiciesemos por pantalla para que no haya problemas con el asigment UE
                            asignacion.setLineItemValue('custpage_x_recmachcustrecord_x_geasli_parent1', 'custpage_custrecord_x_geasli_qty', j, receipt.getLineItemValue('item', 'quantity', i)); 
                        } 
                        nlapiLogExecution('DEBUG', 'location: ', receipt.getLineItemValue('item', 'location', i));
                        if(modificarLocation == 1){
                            asignacion.setLineItemValue('custpage_x_recmachcustrecord_x_geasli_parent1', 'custpage_custrecord_x_geasli_locationto', j, receipt.getLineItemValue('item', 'location', i));
                        }
                    }
                }
            }
            
            if(modificarCantidad == 1 || modificarLocation ==  1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarDate == 1 || modificarAlbProv == 1){ 
                //Guardamos asignación
                nlapiSubmitRecord(asignacion, true, false);
                var asignacion = nlapiLoadRecord('customrecord_x_tb_geas', asignacionId);
            }

			//Actualizamos el pedido
            if(modificarCantidad == 1 || modificarLocation == 1 || modificarDate == 1 || modificarAlbProv == 1){

                var lineasOriginal = new Array();
                var lineasPendientes = new Array();
                
                //Cargamos el pedido en función del tipo
                if(receipt.getFieldValue('custbody_x_albaran_prov') == 'TrnfrOrd'){
                    
                    //Pedido de transferencia
                    var purchaseOrder = nlapiLoadRecord('transferorder', purchaseOrderId);
                    nlapiLogExecution('DEBUG', 'Pedido de transferencia: ', purchaseOrder);
                } else {
                    //Pedido de compra
                    var purchaseOrder = nlapiLoadRecord('purchaseorder',purchaseOrderId);
                    nlapiLogExecution('DEBUG', 'Pedido de compra', purchaseOrder);
                }

                //Obtenemos la línea del pedido de compra que tiene asignada la recepción
                var purchaseLineReceipt = receipt.getLineItemValue('item', 'custcol_x_updreceipt_purchaseline', i);
                nlapiLogExecution('DEBUG', 'purchaseLineReceipt: ',purchaseLineReceipt);

                var numLineasPed = purchaseOrder.getLineItemCount('item');

                for(var j = 1; j <= numLineasPed; j++){
                    purchaseOrder.selectLineItem('item',j);
                    
                    //Actualizamos la info de la línea de la recepción
                    var purchaseOrderLine = purchaseOrder.getLineItemValue('item', 'custcol_x_updreceipt_purchaseline', j);

                    if(purchaseLineReceipt == purchaseOrderLine){
                        if(modificarAlbProv == 1){
                            purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_albaran_prov', receipt.getFieldValue('custbody_x_albaran_prov'));
                        }
                        if(modificarDate == 1){
                            purchaseOrder.setCurrentLineItemValue('item','custcol_x_receiptdate', receipt.getFieldValue('trandate'));
                        }
                        if(modificarCantidad == 1){
                            
                            //Modificamos la línea que tenga la línea de albarán relacionada
                            purchaseOrder.setCurrentLineItemValue('item', 'quantity', receipt.getLineItemValue('item', 'quantity',  i));

                            //Nos almacenamos la línea del pedido para comprobar si hay divsiones de esta línea
                            nlapiLogExecution('DEBUG', 'Guardamos línea pedido para ver divisiones');
                            
                            // Diferencia cantidad
                            var diferencia = parseFloat(receiptOld.getLineItemValue('item', 'quantity', i)) - parseFloat(receipt.getLineItemValue('item', 'quantity', i));
                            nlapiLogExecution('DEBUG', 'Diferencia: ', diferencia);
                            //Buscamos la línea original y le hacemos el ajuste de cantidad
                            lineasOriginal.push({lineaOrig: purchaseOrderLine,diferencia: diferencia})                   
                            //Si la diferencia es mayor que 0, habrá que almacenar la info de la línea para pdoer hacer una división
                            if(diferencia > 0){
                                lineasPendientes.push({
                                    item: purchaseOrder.getCurrentLineItemValue('item', 'item'),
                                    location: receipt.getCurrentLineItemValue('item', 'location'),
                                    tasaManual: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_tasamanual'),
                                    rate: purchaseOrder.getCurrentLineItemValue('item', 'rate'),
                                    precioTarifa: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_precio_tarifa'),
                                    taxCode: purchaseOrder.getCurrentLineItemValue('item', 'taxcode'),
                                    orderLineVision: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_updreceipt_purchaseline'),
                                    origOrderLine: purchaseOrder.getCurrentLineItemValue('item', 'lineuniquekey'),
                                    originalOrderQty: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_originalorderquantity'),
                                    densidad: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_densidad'),
                                    codigoTaric: purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_codigotaric'),
                                    countryOrig: purchaseOrder.getCurrentLineItemValue('item', 'custcol_country_of_origin_code'),
                                    albProv: receipt.getCurrentLineItemValue('item', 'custbody_x_albaran_prov'),
                                    receiptDate: receipt.getCurrentLineItemValue('item', 'trandate'),                                      
                                    quantity: diferencia,
                                    lineaOrig: purchaseOrderLine
                                })
                            }                           
                        }
                        if(modificarLocation == 1){
                            //Modificamos la línea que tenga la línea de albarán relacionada
                            purchaseOrder.setCurrentLineItemValue('item','location', receipt.getCurrentLineItemValue( 'item', 'location'));
                        }
                        if(modificarTarifaTrans == 1){
                            //Tenemos que modificar también los campos de la asignación
                            var pesoTotal = asignacion.getFieldValue('custrecord_x_geas_totalweight'); 
                            purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_geas_totalweight', pesoTotal);
                            var tarifa = asignacion.getFieldValue('custrecord_x_geas_rateprice'); 
                            purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_geas_rateprice', tarifa);
                        }
                        if(modificarAgenciaTrans == 1){
                            //Tenemos que modificar también los campos de la asignación
                            purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_geas_agency', receipt.getFieldValue('custbody_ai_transport_agency'));
                        }
                    }
                    purchaseOrder.commitLineItem('item');
                }
            }
            if(modificarCantidad == 1 || modificarLocation == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarDate == 1 || modificarAlbProv == 1 || modificarDateAlbProv == 1){ 
                //Guardamos asignación
                var servicePurchaseId = asignacion.getFieldValue('custrecord_x_geas_purchaseserviceorder');
                var serviceSalesId = asignacion.getFieldValue('custrecord_x_geas_salesserviceorder');  

                //++[SLV] ICL_E027. (24/03/2023)
                if(modificarCantidad == 1){
                    
                    //Actualizar pendientes en pedido
                    //--Nos recorremos las líenas del pedido para actualizar la cantidad de la líena original
                    if(!!lineasOriginal){
                        nlapiLogExecution('DEBUG', 'lineasOriginal: ', lineasOriginal.length);
                        //Nos recorremos el pedido
                        for(var j = 1; j <= numLineasPed; j++){
                            //Obtenemos la línea original
                            purchaseOrder.selectLineItem('item',j);
                            var lineaDivision = purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_orderlinedivision');
                            nlapiLogExecution('DEBUG',  'j: ', j);
                            nlapiLogExecution('DEBUG', 'lineaDivision actualizar: ', lineaDivision);
                            var diferencia = 0;
                            for(var k = 0; k < lineasOriginal.length; k++){
                                diferencia = parseFloat(lineasOriginal[k].diferencia);
                                if(lineaDivision == lineasOriginal[k].lineaOrig){
                                    tieneLineaPendientes = 1;
                                    //Actualizamos la cantidad pendiente
                                    var cantidadOriginal = purchaseOrder.getCurrentLineItemValue('item', 'quantity');
                                    cantidadOriginal = parseFloat(cantidadOriginal) + parseFloat(lineasOriginal[k].diferencia);
                                    nlapiLogExecution('DEBUG', 'cantidadUpdatear: ', cantidadOriginal);
                                    purchaseOrder.setCurrentLineItemValue('item', 'quantity', cantidadOriginal);
                                    purchaseOrder.commitLineItem('item');
                                }
                            }
                        }
                    }
                }
                if(modificarCantidad == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 ||  modificarAlbProv == 1 || modificarDate == 1 || modificarDateAlbProv == 1 || modificarLocation == 1){
                    if(!!serviceSalesId || !!servicePurchaseId){
                        
                        var pesoTotal = asignacion.getFieldValue('custrecord_x_geas_totalweight'); 
                        //En service sales tiene que ir en toneladas y no en kilos
                        //pesoTotal = pesoTotal * 1000;//Multiplicamos porque en la asignación está en Toneladas y aquí en Kilos      
                        nlapiLogExecution('DEBUG', 'pesoTotal: ', pesoTotal);              

                        var precio = asignacion.getFieldValue('custrecord_x_geas_price'); 
                        nlapiLogExecution('DEBUG', 'Precio: ', precio);

                        var rateprice = asignacion.getFieldValue('custrecord_x_geas_rateprice'); 
                        nlapiLogExecution('DEBUG', 'Rateprice: ', rateprice);
                    }
                    //Pedido venta servicio
                    nlapiLogExecution('DEBUG', 'ServiceSalesId: ', serviceSalesId);
                    if(!!serviceSalesId){
                        //Tenemos que actualizar 
                        var serviceSales = nlapiLoadRecord('salesorder', serviceSalesId);
                        nlapiLogExecution('DEBUG', 'serviceSales: ', serviceSales);
                        nlapiLogExecution('DEBUG', 'asignacionId: ', asignacionId);

                        //++[SLV] ICL_E027. (24/05/2023)
                        //Validar que si se ha borrado el transportista
                        if(modificarAgenciaTrans == 1){
                            if(!!receipt.getFieldValue('custbody_ai_transport_agency')){
                                nlapiLogExecution('DEBUG', 'SLV BORRAR Hay agenciatrans');
                            }
                            else{
                                nlapiLogExecution('DEBUG', 'SLV BORRAR No hay agenciatrans');

                            }
                        }
                        //--[SLV] ICL_E027. (24/05/2023)
                        
                        //Peso total
                        serviceSales.setFieldValue('custbody_x_geas_totalweight', pesoTotal); 
                        var numLineasSS = serviceSales.getLineItemCount('item');
                        for(var j = 1; j <= numLineasSS; j++){
                            //Solo la línea que sea de la asignación
                            var asigservice = serviceSales.getLineItemValue('item', 'custcol_x_geas_assigncode', j); 
                            nlapiLogExecution('DEBUG', 'asigservice: ', asigservice);
                            if(asigservice == asignacionId){
                                //Peso total
                                serviceSales.setLineItemValue('item', 'custcol_x_geas_totalweight', j, pesoTotal);
                                //Obtener tarifa cliente que está en la línea
                                var tarifaCliente = serviceSales.getLineItemValue('item', 'custcol_x_geas_orderservicerateprice', j); 
                                //No hay que dividir /1000 en services sales 
                                //var precioSales = parseFloat(tarifaCliente)*parseFloat(pesoTotal/1000);
                                var precioSales = parseFloat(tarifaCliente)*parseFloat(pesoTotal);

                                //Amount (precio * tarifa cliente)
                                serviceSales.setLineItemValue('item', 'amount', j, precioSales);  
                                //Rate (precio * tarifa cliente)
                                serviceSales.setLineItemValue('item', 'rate', j, precioSales); 
                                //Rate price
                                serviceSales.setLineItemValue('item', 'custcol_x_geas_rateprice', j, rateprice); 
                                
                                //Transportista
                                if(modificarAgenciaTrans == 1){
                                    var entityid;
                                    if(!!receipt.getFieldValue('custbody_ai_transport_agency')){
                                        entityid = nlapiLookupField('vendor', receipt.getFieldValue('custbody_ai_transport_agency'), 'entityid');
                                    }
                                    serviceSales.setCurrentLineItemValue('item', 'custcol_x_geas_agency', entityid);
                                }
                                if(modificarDate == 1){
                                    serviceSales.setLineItemValue('item', 'custcol_x_geas_receiptdate', j, receipt.getFieldValue('trandate')); 
                                }
                                //Albarán
                                if(modificarAlbProv == 1){
                                    serviceSales.setLineItemValue('item', 'custcol_x_rec_alb_proveedor', j, receipt.getFieldValue('custbody_x_albaran_prov')); 
                                }
                                //Fecha proveedor
                                if(modificarDateAlbProv == 1){
                                    serviceSales.setLineItemValue('item', 'custcol_x_geas_receiptdate', j, receipt.getFieldValue('custbody_x_fecha_alb_proveedor')); 
                                }
                                //Ciudad destino (si cambia la location)
                                if(modificarLocation == 1){
                                    var ciudadDestino = asignacion.getFieldValue('custrecord_x_geas_citydestiny'); 
                                    serviceSales.setLineItemValue('item', 'custcol_x_geas_citydestiny', j, ciudadDestino); 
                                }
                            }
                        }
                        nlapiSubmitRecord(serviceSales, true, false);
                        //++[SLV] ICL_E027. (28/03/2023)
                        //Obtenemos el id del artículo que tenemos que modificar
                        var item = obtenerIdItemRefacturaTransporteWF();
                        nlapiLogExecution('DEBUG', 'item: ', item);

                        //Actualizamos el assembly build
                        //-- Primero tenemos que buscar el assembly build que tenga la asignación
                        var assemblyId = obtenerIdAssemblyBuild(asignacionId);
                        nlapiLogExecution('DEBUG', 'assemblyId: ', assemblyId);

                        if(!!assemblyId){
                            var assembly = nlapiLoadRecord('assemblybuild', assemblyId);
                            nlapiLogExecution('DEBUG', 'assembly: ', assembly);

                            //--Actualizamos la cantidad de la construcción 
                            assembly.setFieldValue('quantity', receipt.getLineItemValue('item', 'quantity', i));
                            var inventorydetail =  assembly.editSubrecord('inventorydetail');
                            var internalid = inventorydetail.getLineItemValue('inventoryassignment','internalid', 1); 
                            nlapiLogExecution('DEBUG', 'internaalid cabecera: ', internalid);

                            inventorydetail.setLineItemValue('inventoryassignment', 'quantity', 1, receipt.getLineItemValue('item', 'quantity', i));  
                            inventorydetail.commitLineItem('inventoryassignment');
                            inventorydetail.commit();

                            //--Nos recorremos las líneas de la OF y modificar la línea que tenga el artículo de refactura transportes
                            var numLineasAse = assembly.getLineItemCount('component');
                            nlapiLogExecution('DEBUG', 'numLineas assembly: ', numLineasAse);
                            for(var j = 1; j <= numLineasAse; j++){   

                                nlapiLogExecution('DEBUG', 'item assembly: ', assembly.getLineItemValue('component', 'item', j));

                                if(assembly.getLineItemValue('component', 'item', j) == item){
                                    assembly.setLineItemValue('component','quantity', j, asignacion.getFieldValue('custrecord_x_geas_price')); 
                                    nlapiLogExecution('DEBUG', 'Actualizar assembly quantity: ', asignacion.getFieldValue('custrecord_x_geas_price'));
                                }
                                if(assembly.getLineItemValue('component', 'item', j) == assembly.getFieldValue('item')){
                                    nlapiLogExecution('DEBUG', 'component: ', assembly.getLineItemValue('component', 'item', j));
                                    assembly.selectLineItem('component', j);
                                    assembly.setCurrentLineItemValue('component', 'quantity', assembly.getFieldValue('quantity'));
                                    
                                    var inventorydetail =  assembly.editCurrentLineItemSubrecord('component','componentinventorydetail');
                                    var internalid = inventorydetail.getLineItemValue('inventoryassignment','internalid', 1); 
                                    nlapiLogExecution('DEBUG', 'internaalid item: ', internalid);

                                    inventorydetail.setLineItemValue('inventoryassignment', 'quantity', 1, assembly.getFieldValue('quantity'));  
                                    inventorydetail.commitLineItem('inventoryassignment');
                                    inventorydetail.commit();  
                                    nlapiLogExecution('DEBUG', 'Actualizar assembly quantity: ', asignacion.getFieldValue('custrecord_x_geas_price'));
                                    assembly.commitLineItem('component');
                                }
                            }
                            nlapiSubmitRecord(assembly, true, false); 

                            //Actualizar OF 
                            //-- Primero tenemos que buscar la work order que tenga la asignación
                            var ofId = obtenerIdWorkOrder(asignacionId);
                            nlapiLogExecution('DEBUG', 'ofId: ', ofId);

                            var of = nlapiLoadRecord('workorder',ofId);
                            nlapiLogExecution('DEBUG', 'of: ', of);

                            //--Nos recorremos las líneas de la OF y modificar la línea que tenga el artículo de refactura transportes
                            var numLineasOF = of.getLineItemCount('item');
                            nlapiLogExecution('DEBUG', 'numLineasOF: ', numLineasOF);
                            for(var j = 1; j <= numLineasOF; j++){   
                                nlapiLogExecution('DEBUG', 'item of: ', of.getCurrentLineItemValue('item', 'item'));
                                if(of.getLineItemValue('item', 'item', i) == item){
                                    of.nlapiSetLineItemValue('item','quantity', j, asignacion.getFieldValue('custrecord_x_geas_price')); 
                                    of.nlapiSetLineItemValue('item', 'quantityfulfilled', j, asignacion.getFieldValue('custrecord_x_geas_price')); 
                                    nlapiSubmitRecord(of, true, false);
                                    nlapiLogExecution('DEBUG', 'Actualizar of quantity: ', asignacion.getFieldValue('custrecord_x_geas_price'));
                                }
                            }
                        }
                         //--[SLV] ICL_E027. (28/03/2023)
                    }
                    //Pedido compra servicio
                    //++[SLV] ICL_E027. (27/03/2023)
                    var avanzarPurchaseService = 1;
                    if(modificarAgenciaTrans == 1){
                        
                        //Validar si el nuevo transportista es un proveedor de transporte logística
                        if(!!receipt.getFieldValue('custbody_ai_transport_agency')){
                            var vendor = nlapiLoadRecord('vendor', receipt.getFieldValue('custbody_ai_transport_agency'));
                            var logistica = vendor.getFieldValue('custentity_x_vend_transportwithoutservpo');
                            nlapiLogExecution('DEBUG', 'check prov logistica: ', logistica);
                        }
                        else{
                            //Asignamos a true variable para que elimine pedido si lo han quitado
                            var logistica = true;
                        }
                        
                        if(logistica == 'T'){
                            //Si está marcado (no aplica pedido compra) y hay pedido de compra, hay que borrarlo
                            if(!!servicePurchaseId){ 
                                nlapiDeleteRecord('purchaseorder',servicePurchaseId);
                                //Que no actualice el pedido ya que lo hemos borrado
                                avanzarPurchaseService = 0;
                                nlapiLogExecution('DEBUG', 'Pedido de compra servicio borrado', 'Borrado');
                            }
                        } else{
                            //Si no está marcado (aplica pedido de compra) y no hay pedido de compra, hay que crearla
                            if(!servicePurchaseId){ 
                               
                                var idservpur = crearPedidoCompraServicio(asignacion, receipt.getFieldValue('trandate'));

                                nlapiLogExecution('DEBUG', 'idservpur:', '*'+idservpur+'*');
                                nlapiSubmitField('customrecord_x_tb_geas', asignacionId, 'custrecord_x_geas_purchaseserviceorder', idservpur);
                                nlapiLogExecution('DEBUG', 'Pedido de compra servicio creado', 'Creado');

                            }
                        }
                    }
                    nlapiLogExecution('DEBUG', 'servicePurchaseId: ', '*'+servicePurchaseId+'*');
                    
                    //if(!!servicePurchaseId){
                    if(!!servicePurchaseId && avanzarPurchaseService == 1){
                    
                        //--[SLV] ICL_E027. (27/03/2023)
                        //Tenemos que actualizar 
                        var servicePurchase = nlapiLoadRecord('purchaseorder', servicePurchaseId);
                        nlapiLogExecution('DEBUG','servicePurchase: ', servicePurchase);
                        //Peso total
                        pesoTotal = pesoTotal * 1000;
                        servicePurchase.setFieldValue('custbody_x_geas_totalweight', pesoTotal);  
                        //Rate price
                        servicePurchase.setFieldValue('custbody_x_geas_rateprice', rateprice); 
                        //Proveedor
                        servicePurchase.setFieldValue('entity', receipt.getFieldValue('custbody_ai_transport_agency')); 
                    
                        var numLineasSP = servicePurchase.getLineItemCount('item');
                        for(var j = 1; j <= numLineasSP; j++){

                            //Amount
                            servicePurchase.setLineItemValue('item', 'amount', j, precio); 
                            //Rate
                            servicePurchase.setLineItemValue('item', 'rate', j, precio); 
                            //Total weight
                            servicePurchase.setLineItemValue('item', 'custcol_x_geas_totalweight', j, pesoTotal); 
                            //Rate price
                            servicePurchase.setLineItemValue('item', 'custcol_x_geas_rateprice', j, rateprice); 
                            //Fecha recepción
                            if(modificarDate == 1){
                                servicePurchase.setLineItemValue('item', 'custcol_x_geas_fulfillmentdate', j, receipt.getFieldValue('trandate')); 
                                servicePurchase.setLineItemValue('item', 'custcol_x_receiptdate', j, receipt.getFieldValue('trandate')); 
                            }
                            //Albarán
                            if(modificarAlbProv == 1){
                                servicePurchase.setLineItemValue('item', 'custcol_x_albaran_prov', j, receipt.getFieldValue('custbody_x_albaran_prov')); 
                            }
                            //Fecha albarán proveedor
                            if(modificarDateAlbProv == 1){
                                servicePurchase.setLineItemValue('item', 'custcol_x_geas_receiptdate', j, receipt.getFieldValue('custbody_x_fecha_alb_proveedor')); 
                            }
                            //Ciudad destino (si cambia la location)
                            if(modificarLocation == 1){
                                var ciudadDestino = asignacion.getFieldValue('custrecord_x_geas_citydestiny'); 
                                servicePurchase.setLineItemValue('item', 'custcol_x_geas_citydestiny', j, ciudadDestino); 
                            }
                        }
                        nlapiSubmitRecord(servicePurchase, true, false);
                    }
                }

                if(modificarCantidad == 1){
                    //Comprobamos si tenemos que generar líneas pendientes
                    if(!!lineasPendientes){
                        nlapiLogExecution('DEBUG', 'lineasPendientes: ', lineasPendientes);
                        for(var k = 0; k < lineasPendientes.length; k++){
                            //Obtenemos la línea original
                            var encontrado = 0;
                            var lineaOrig = lineasPendientes[k].lineaOrig;
                            nlapiLogExecution('DEBUG', 'lineaOrig: ', lineaOrig);
                            //Validamos si existe línea de pendientes
                            for(var j = 1; j <= numLineasPed; j++){
                                purchaseOrder.selectLineItem('item', j);
                                if(lineaOrig == purchaseOrder.getCurrentLineItemValue('item', 'custcol_x_orderlinedivision')){
                                    encontrado = 1;
                                }
                            }
                            //Si no hay línea de pendientes la creamos
                            if(encontrado == 0){
                                purchaseOrder.selectNewLineItem('item');
                                purchaseOrder.setCurrentLineItemValue('item', 'item', lineasPendientes[k].item);
                                purchaseOrder.setCurrentLineItemValue('item', 'location', lineasPendientes[k].location);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_tasamanual', lineasPendientes[k].tasaManual);
                                purchaseOrder.setCurrentLineItemValue('item', 'rate', lineasPendientes[k].rate);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_precio_tarifa', lineasPendientes[k].precioTarifa);
                                purchaseOrder.setCurrentLineItemValue('item', 'taxcode', lineasPendientes[k].taxCode);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_orderlinedivision', lineasPendientes[k].orderLineVision);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_originalorderline', lineasPendientes[k].origOrderLine);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_originalorderquantity', lineasPendientes[k].originalOrderQty);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_densidad', lineasPendientes[k].densidad);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_codigotaric', lineasPendientes[k].codigoTaric);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_country_of_origin_code', lineasPendientes[k].countryOrig);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_albaran_prov', lineasPendientes[k].albProv);
                                purchaseOrder.setCurrentLineItemValue('item', 'custcol_x_receiptdate', lineasPendientes[k].receiptDate);
                                purchaseOrder.setCurrentLineItemValue('item', 'quantity', lineasPendientes[k].quantity);
                                purchaseOrder.commitlineitem('item');
                            }
                        }
                    }
                }
                //Guardamos pedido
                if(modificarCantidad == 1 || modificarLocation == 1 || modificarDate == 1 || modificarAlbProv == 1){
                    nlapiSubmitRecord(purchaseOrder, true, false);
                }
            }
                    
            //++[SLV] ICL_E027. (08/05/2023)
            //Comprobamos si la asignación tiene albarán (venta directa) -- Si la cantidad nueva es mayor que la vieja
            if(receipt.getCurrentLineItemValue('item', 'quantity') >= receiptOld.getCurrentLineItemValue('item', 'quantity')){
                var albaranVentaDirecta = asignacion.getFieldValue('custrecord_x_as_fulfillment'); 
                if(!!albaranVentaDirecta){
                    nlapiLogExecution('DEBUG', 'albaranVentaDirecta: ', albaranVentaDirecta);
                    if(modificarCantidad == 1 || modificarLocation == 1 || modificarTarifaTrans == 1 || modificarAgenciaTrans == 1 || modificarDate == 1){
                        //Modificamos el albarán para que se ejecute el workflow
                        var albaran = nlapiLoadRecord('itemfulfillment',albaranVentaDirecta);
                        nlapiLogExecution('DEBUG', 'albaran: ', albaran);

                        if(modificarTarifaTrans == 1){
                            albaran.setFieldValue('custbody_ai_transport_rate', receipt.getFieldValue('custbody_ai_transport_rate')); 
                        }
                        if(modificarAgenciaTrans == 1){
                            albaran.setFieldValue('custbody_ai_transport_agency', receipt.getFieldValue('custbody_ai_transport_agency')); 
                        }
                        if(modificarDate == 1){
                            albaran.setFieldValue('trandate', receipt.getFieldValue('trandate')); 
                        }

                        var numLineasAlb = albaran.getLineItemCount('item');

                        for(var l = 1; l <= numLineasAlb; l++){
                            //Validar que el artículo y la cantidad original coinciden en la recepción y albarán

                            if( (receiptOld.getLineItemValue('item', 'quantity', i) == albaran.getLineItemValue('item', 'quantity', l) ) && ( receipt.getLineItemValue('item', 'item', i) == albaran.getLineItemValue('item', 'item', l)) ){

                                if(modificarCantidad == 1){
                                    albaran.selectLineItem('item', l);
                                    nlapiLogExecution('DEBUG', 'Cantidad: ', receipt.getLineItemValue('item', 'quantity', i));
                                    albaran.setLineItemValue('item', 'quantity', l, receipt.getLineItemValue('item', 'quantity', i)); 

                                    var inventorydetail = albaran.editCurrentLineItemSubrecord('item', 'inventorydetail');
                                    inventorydetail.setLineItemValue('inventoryassignment', 'quantity', 1, receipt.getLineItemValue('item', 'quantity', i));  
                                    nlapiLogExecution('DEBUG', 'Inv.det lot num: ', inventorydetail.getLineItemValue('inventoryassignment', 'issueinventorynumber', 1));

                                    inventorydetail.commitLineItem('inventoryassignment');
                                    inventorydetail.commit();
                                    albaran.commitLineItem('item');
                                }
                                /* Si cambia la location en en la recepcion, en el albaran no tiene que actualizarse
                                if(modificarLocation == 1){
                                    albaran.selectLineItem('item', l);
                                    var inventorydetail = albaran.editCurrentLineItemSubrecord('item', 'inventorydetail');
                                    var internalid = inventorydetail.getLineItemValue('inventoryassignment','internalid', 1); 

                                    albaran.setLineItemValue('item', 'location', l, receipt.getLineItemValue('item', 'location', i));
                                }
                                */
                            }
                        }
                        nlapiSubmitRecord(albaran, true, false);
                    }
                }
            }
            //--[SLV] ICL_E027. (08/05/2023)
        }
    }
    nlapiLogExecution('DEBUG', 'Fin ejecución editItemReceipt_WF');
}


function obtenerAsignacion(receiptId){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("custrecord_x_geas_code"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custrecord_x_geas_serviceorderreception",null,"is",receiptId));
    
    var asig = nlapiSearchRecord('customrecord_x_tb_geas', null, filtros, columnas);
    
    return asig[0].getValue('custrecord_x_geas_code');
}

//++[SLV] ICL_E027. (27/03/2023)
function crearPedidoCompraServicio(asignacion, trandate){

    var pedidoServicio = nlapiCreateRecord('purchaseorder');
    pedidoServicio.setFieldValue("entity", asignacion.getFieldValue('custrecord_x_geas_transprovider'));
    pedidoServicio.setFieldValue("subsidiary", getLogisticaID());
    pedidoServicio.setFieldValue("approvalstatus", 2);
    pedidoServicio.setFieldValue("custbody_x_geas_assigncode", asignacion.getFieldValue('id'));
    pedidoServicio.setFieldValue("custbody_x_geas_vendordeliverynumber", asignacion.getFieldValue('custrecord_x_geas_vendordeliverynumber'));
    pedidoServicio.setFieldValue("custbody_x_geas_fulfillment", asignacion.getFieldValue('custrecord_x_as_fulfillment'));
    pedidoServicio.setFieldValue("custbody_x_geas_totalweight", asignacion.getFieldValue('custrecord_x_geas_totalweight')*1000);
    pedidoServicio.setFieldValue("custbody_x_geas_rateprice", asignacion.getFieldValue('custrecord_x_geas_rateprice'));
    pedidoServicio.setFieldValue("custbody_x_geas_truck", asignacion.getFieldValue('custrecord_x_geas_truck'));
    pedidoServicio.setFieldValue("custbody_x_geas_cityorigin", asignacion.getFieldValue('custrecord_x_geas_cityorigin'));
    pedidoServicio.setFieldValue("custbody_x_geas_citydestiny", asignacion.getFieldValue('custrecord_x_geas_citydestiny'));
    pedidoServicio.setFieldValue("custbody_x_geas_fulfillmentdate", trandate);

    pedidoServicio.selectNewLineItem('item');
    pedidoServicio.setCurrentLineItemValue('item', 'item', obtenerIdItemServiciosWF());
    pedidoServicio.setCurrentLineItemValue('item', 'amount', asignacion.getFieldValue('custrecord_x_geas_price'));
    pedidoServicio.setCurrentLineItemValue('item', 'rate', asignacion.getFieldValue('custrecord_x_geas_price'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_tasamanual', 'T');
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_albaran_prov', asignacion.getFieldValue('custrecord_x_geas_vendordeliverynumber'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_fulfillment', asignacion.getFieldValue('custrecord_x_as_fulfillment'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_totalweight', asignacion.getFieldValue('custrecord_x_geas_totalweight')*1000);
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_rateprice', asignacion.getFieldValue('custrecord_x_geas_rateprice'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_truck', asignacion.getFieldValue('custrecord_x_geas_truck'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_cityorigin', asignacion.getFieldValue('custrecord_x_geas_cityorigin'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_citydestiny', asignacion.getFieldValue('custrecord_x_geas_citydestiny'));
    pedidoServicio.setCurrentLineItemValue('item', 'custcol_x_geas_fulfillmentdate', trandate);
    pedidoServicio.commitLineItem('item');

    return nlapiSubmitRecord(pedidoServicio, true, false);
}

// Función de utilidades para obtener el ID de un artículo de servicios
//------------------------------------------------------------------------------------------------------
function obtenerIdItemServiciosWF(){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("internalid"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custitem_x_item_serviceitem",null,"is",'T'));
    
    var item = nlapiSearchRecord('item', null, filtros, columnas);
    
    if(!!item){
        return item[0].getValue('internalId');
    } else {
        return null;
    }
}

function obtenerIdWorkOrder(assignId){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("internalid"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custbody_x_geas_assigncode",null,"is",assignId));
    
    var wo = nlapiSearchRecord('workorder', null, filtros, columnas);
    
    if(!!wo){
        return wo[0].getValue('internalId');
    } else {
        return null;
    }
}

function obtenerIdItemRefacturaTransporteWF(){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("internalid"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custitem_x_item_transportreinvoiceitem",null,"is",'T'));
    
    var item = nlapiSearchRecord('item', null, filtros, columnas);

    if(!!item){
        return item[0].getValue('internalId');
    } else {
        return null;
    }
}

function obtenerIdAssemblyBuild(assignId){

    var columnas = new Array();
    columnas.push(new nlobjSearchColumn("internalid"));   
    var filtros = new Array();
    filtros.push(new nlobjSearchFilter("custbody_x_geas_assigncode",null,"is",assignId));
    
    var ab = nlapiSearchRecord('assemblybuild', null, filtros, columnas);

    if(!!ab){
        return ab[0].getValue('internalId');
    } else {
        return null;
    }
}
//--[SLV] ICL_E027. (27/03/2023)
